/**
 * 毎日 0:00 UTC（JST 9:00）に走るバッチ。
 * 全ユーザーに対し、当日の interpretation を引いて daily_messages に保存する。
 *
 * 認証: --no-verify-jwt でデプロイするため、CRON_SECRET の Bearer 検証を必須にする。
 * （未設定のまま起動した場合は全リクエスト拒否 = fail closed）
 *
 * デプロイ:
 *   supabase secrets set CRON_SECRET=<ランダム値>
 *   supabase functions deploy daily-message-batch --no-verify-jwt
 *   スケジューラ側の呼び出しに Authorization: Bearer <CRON_SECRET> を付与
 *   （pg_cron + pg_net の場合は headers に設定）
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

// revenuecat-webhook と同じタイミング攻撃対策付き比較
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---- 60干支テーブル ----
const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"] as const;
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

function pillarFromCycle(idx: number): string {
  const i = ((idx % 60) + 60) % 60;
  return `${STEMS[i % 10]}${BRANCHES[i % 12]}`;
}

// 2024-01-01 = 甲子（cycle 0）
const REF_UTC = Date.UTC(2024, 0, 1);
function todayPillar(): string {
  const todayUTC = new Date();
  const utc = Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate());
  const days = Math.round((utc - REF_UTC) / 86400000);
  return pillarFromCycle(days);
}

// ---- 相性ロジック（lib/compatibility.ts の dailyScore と完全同期）----
// アプリ表示と必ず一致するよう、同じテーブル + 同じスコア配点を inline。
const branchEl: Record<string, string> = {
  寅:"木",卯:"木",巳:"火",午:"火",辰:"土",戌:"土",丑:"土",未:"土",申:"金",酉:"金",亥:"水",子:"水",
};
const SANGO: string[][] = [
  ["申","子","辰"], ["巳","酉","丑"], ["寅","午","戌"], ["亥","卯","未"],
];
const RIKUGO: [string, string][] = [
  ["子","丑"], ["寅","亥"], ["卯","戌"], ["辰","酉"], ["巳","申"], ["午","未"],
];
const CHU: [string, string][] = [
  ["子","午"], ["丑","未"], ["寅","申"], ["卯","酉"], ["辰","戌"], ["巳","亥"],
];
const ELEMENT_GEN: Record<string, string> = { 木:"火",火:"土",土:"金",金:"水",水:"木" };
const ELEMENT_OVER: Record<string, string> = { 木:"土",土:"水",水:"火",火:"金",金:"木" };

function isSango(a: string, b: string): boolean {
  if (a === b) return false;
  return SANGO.some((t) => t.includes(a) && t.includes(b));
}
function isPair(table: [string, string][], a: string, b: string): boolean {
  return table.some(([x, y]) => (x === a && y === b) || (y === a && x === b));
}
function dailyScore(myBranch: string, targetBranch: string): number {
  if (myBranch === targetBranch) return 98;
  if (isSango(myBranch, targetBranch)) return 92;
  if (isPair(RIKUGO, myBranch, targetBranch)) return 86;
  if (isPair(CHU, myBranch, targetBranch)) return 28;
  const me = branchEl[myBranch], t = branchEl[targetBranch];
  if (me === t) return 70;
  if (ELEMENT_GEN[me] === t) return 78;       // 自分が育てる側
  if (ELEMENT_GEN[t] === me) return 82;       // 育てられる側
  if (ELEMENT_OVER[me] === t) return 38;
  if (ELEMENT_OVER[t] === me) return 32;
  return 50;
}

function rankFor(myBranch: string, todayBranch: string): number {
  const scored = BRANCHES.map((b) => ({ b, s: dailyScore(b, todayBranch) }))
    .sort((a, b) => b.s - a.s);
  return scored.findIndex((x) => x.b === myBranch) + 1;
}

// ---- メイン処理 ----
Deno.serve(async (req) => {
  // CRON_SECRET 未設定時も拒否（fail closed）。設定漏れで公開エンドポイントにしない
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!CRON_SECRET || !constantTimeEqual(token, CRON_SECRET)) {
    return new Response("unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date().toISOString().slice(0, 10);
  const targetDayPillar = todayPillar();

  console.log(`[batch] target_day_pillar=${targetDayPillar} date=${today}`);

  // 全アクティブユーザー取得
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, day_pillar, mbti, blood_type, themes")
    .is("deleted_at", null);
  if (uErr) {
    return new Response(`users error: ${uErr.message}`, { status: 500 });
  }

  let inserted = 0;
  let skipped = 0;
  const failures: { user_id: string; error: string }[] = [];

  // 指数バックオフ付きリトライ（最大3回）
  async function upsertWithRetry(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.from("daily_messages").upsert(payload, { onConflict: "user_id,message_date" });
      if (!error) return { ok: true };
      // 一過性のネットワークエラーのみリトライ。NOT NULL 違反等は即諦め
      if (!/network|timeout|fetch/i.test(error.message)) return { ok: false, error: error.message };
      await new Promise((r) => setTimeout(r, 200 * Math.pow(2, attempt)));
    }
    return { ok: false, error: "max retries exceeded" };
  }

  for (const u of users || []) {
    const { data: interp } = await supabase
      .from("interpretations")
      .select("id, headline, body, do_actions, avoid_actions")
      .eq("user_day_pillar", u.day_pillar)
      .eq("target_day_pillar", targetDayPillar)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!interp) { skipped++; continue; }

    const targetBranch = targetDayPillar.slice(-1);
    const myBranch = u.day_pillar.slice(-1);
    const rank = rankFor(myBranch, targetBranch);

    const result = await upsertWithRetry({
      user_id: u.id,
      message_date: today,
      interpretation_id: interp.id,
      rank,
      tone_adjusted_headline: interp.headline,
      tone_adjusted_body: interp.body,
    });
    if (result.ok) inserted++;
    else failures.push({ user_id: u.id, error: result.error || "unknown" });
  }

  if (failures.length > 0) {
    console.error(`[batch] ${failures.length} failures`, failures.slice(0, 10));
  }

  return new Response(JSON.stringify({ inserted, skipped, failed: failures.length, target: targetDayPillar }), {
    headers: { "Content-Type": "application/json" },
  });
});
