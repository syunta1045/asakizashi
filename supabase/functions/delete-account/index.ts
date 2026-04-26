/**
 * アカウント完全削除エンドポイント
 *
 * クライアントは「Bearer <user JWT>」で POST するだけ。
 *
 * 削除順序（部分状態を残さないために auth.users を先に消す）:
 *   1. JWT 検証してユーザーIDを取得
 *   2. auth.users から実削除（FK CASCADE で users / relations / journal_entries も消える）
 *   3. CASCADE が万一構成されていない環境向けの防御として、users 行を明示削除
 *      （既に消えていれば 0 行 affected で OK、エラーにしない）
 *
 * かつての「先に soft delete → 後で auth 削除」は失敗時に
 * 「deleted_at だけ立った半端な行」を残していたため廃止。
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("unauthorized", { status: 401 });
  const jwt = auth.slice(7);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. JWT 検証
  const { data: userData, error: getErr } = await admin.auth.getUser(jwt);
  if (getErr || !userData.user) {
    return jsonError(401, "invalid_token", getErr?.message ?? "invalid token");
  }
  const userId = userData.user.id;

  // 2. auth.users を実削除（破壊的操作を先に行う ＝ 失敗しても DB は無変化）
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) {
    console.error("[delete-account] deleteUser failed:", delErr);
    return jsonError(500, "auth_delete_failed", delErr.message);
  }

  // 3. 念のため users 行も明示削除（CASCADE が無い環境への保険）
  //    既に消えていても問題ないため、エラーは log のみで握りつぶす
  const { error: rowErr } = await admin
    .from("users")
    .delete()
    .eq("auth_id", userId);
  if (rowErr) {
    console.warn("[delete-account] users row cleanup warning:", rowErr.message);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ ok: false, code, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
