/**
 * RevenueCat Webhook 受信エンドポイント
 *
 * 設定:
 *   RevenueCat Dashboard → Project Settings → Webhooks
 *   URL: https://<project>.supabase.co/functions/v1/revenuecat-webhook
 *
 * 認証（2段階で防御）:
 *   1. Bearer 共有シークレット（必須）
 *      Authorization: Bearer <REVENUECAT_AUTH_HEADER の値>
 *      → constant-time 比較でタイミング攻撃対策
 *   2. HMAC 署名（RevenueCat Webhooks v2 が送ってきた場合のみ）
 *      X-RevenueCat-Signature: sha256=<hex>
 *      → REVENUECAT_WEBHOOK_SECRET で検証
 *   3. リプレイ攻撃対策: event の event_timestamp_ms が ±300秒の範囲内
 *
 * 必須環境変数:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   REVENUECAT_AUTH_HEADER  ← Bearer の値
 *   REVENUECAT_WEBHOOK_SECRET ← HMAC 用（v2 ダッシュボード発行）
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AUTH_HEADER_SECRET = Deno.env.get("REVENUECAT_AUTH_HEADER") ?? "";
const HMAC_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET") ?? "";

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // ±5分

type RCEvent = {
  event: {
    type: "INITIAL_PURCHASE" | "RENEWAL" | "CANCELLATION" | "EXPIRATION" | "BILLING_ISSUE" | "PRODUCT_CHANGE" | "TEST";
    app_user_id: string;
    product_id: string;
    expiration_at_ms?: number;
    event_timestamp_ms?: number;
  };
};

/** タイミング攻撃に強い文字列比較 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-SHA256 検証。Signature header は "sha256=<hex>" 形式 */
async function verifyHmac(rawBody: string, signatureHeader: string, secret: string): Promise<boolean> {
  const sig = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const macBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(macBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return constantTimeEqual(expected, sig.toLowerCase());
}

Deno.serve(async (req) => {
  // 1. Bearer 共有シークレット（必須）
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${AUTH_HEADER_SECRET}`;
  if (!AUTH_HEADER_SECRET || !constantTimeEqual(auth, expected)) {
    return new Response("unauthorized", { status: 401 });
  }

  // 2. HMAC 署名（送られてきた場合のみ検証）
  const rawBody = await req.text();
  const sigHeader = req.headers.get("x-revenuecat-signature");
  if (sigHeader) {
    if (!HMAC_SECRET) {
      console.error("[webhook] HMAC signature received but REVENUECAT_WEBHOOK_SECRET unset");
      return new Response("hmac secret missing", { status: 500 });
    }
    const ok = await verifyHmac(rawBody, sigHeader, HMAC_SECRET);
    if (!ok) {
      console.warn("[webhook] HMAC verification failed");
      return new Response("invalid signature", { status: 401 });
    }
  }

  let body: RCEvent;
  try {
    body = JSON.parse(rawBody) as RCEvent;
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const e = body?.event;
  if (!e || !e.type || !e.app_user_id) {
    return new Response("invalid payload", { status: 400 });
  }

  // 3. リプレイ攻撃対策: タイムスタンプが ±5分以内か
  if (e.event_timestamp_ms) {
    const drift = Math.abs(Date.now() - e.event_timestamp_ms);
    if (drift > REPLAY_WINDOW_MS) {
      console.warn(`[webhook] timestamp drift ${drift}ms exceeds window`);
      return new Response("timestamp out of window", { status: 401 });
    }
  }

  // TEST イベントは無視（疎通確認用）
  if (e.type === "TEST") return new Response("ok (test)");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const planMap: Record<string, "premium_monthly" | "premium_yearly"> = {
    premium_monthly: "premium_monthly",
    premium_yearly: "premium_yearly",
  };
  const plan = planMap[e.product_id] || "premium_monthly";

  let status: "active" | "expired" | "cancelled" | "billing_issue" = "active";
  if (e.type === "EXPIRATION") status = "expired";
  else if (e.type === "CANCELLATION") status = "cancelled";
  else if (e.type === "BILLING_ISSUE") status = "billing_issue";

  const expires = e.expiration_at_ms ? new Date(e.expiration_at_ms).toISOString() : null;

  const { error } = await supabase.from("subscriptions").upsert({
    user_id: e.app_user_id,
    plan,
    status,
    expires_at: expires,
    revenuecat_customer_id: e.app_user_id,
    started_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("subscription upsert error:", error);
    return new Response(error.message, { status: 500 });
  }
  return new Response("ok");
});
