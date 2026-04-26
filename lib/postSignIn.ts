/**
 * サインイン成功後 / サインアウト時の共通後処理
 *
 * 「Apple だけ ensureRevenueCatConfigured を呼び忘れる」のような
 * プロバイダ間ズレを構造的に防ぐためのオーケストレーションレイヤー。
 *
 * テスト容易性のため、副作用関数は `import` 経由で外から差し替え可能な
 * 形にしている（ut で jest.mock してフローを検証できる）。
 */
import { useUser } from "./store";
import { syncOnSignIn } from "./sync";
import { ensureRevenueCatConfigured, resetRevenueCat } from "./revenuecat";
import { signOut as supabaseSignOut } from "./supabase";
import { track } from "./analytics";
import { errorMessage } from "./errors";

export type FinishSignInResult = {
  ok: boolean;
  /** サインイン後に向かうべきルート */
  route: "/today" | "/(onboarding)/name";
  /** 失敗時のメッセージ。ok=true のときは undefined */
  error?: string;
};

/**
 * サインイン直後に必ず通すべき後処理:
 *   1. サーバ同期 (pull / push)
 *   2. RevenueCat 初期化（未設定環境でも no-op、失敗は warn + 解析イベント）
 *   3. オンボ済か否かでルート決定
 *
 * 同期失敗時は ok=false で返し、route は呼び出し側に「進めないで」と伝える。
 */
export async function finishSignIn(): Promise<FinishSignInResult> {
  const sync = await syncOnSignIn();
  if (!sync.ok) {
    return { ok: false, route: "/today", error: sync.error };
  }
  // RevenueCat: 失敗してもサインイン自体は成立。ただし握りつぶさず可観測化
  try {
    const r = await ensureRevenueCatConfigured();
    if (!r.ok && r.error && r.error !== "未設定" && r.error !== "未ログイン") {
      console.warn("[postSignIn] RevenueCat 初期化失敗:", r.error);
      track("revenuecat_init_failed", { reason: r.error });
    }
  } catch (e: unknown) {
    const msg = errorMessage(e);
    console.warn("[postSignIn] RevenueCat 初期化例外:", msg);
    track("revenuecat_init_failed", { reason: msg });
  }
  const onboarded = useUser.getState().isOnboarded;
  return { ok: true, route: onboarded ? "/today" : "/(onboarding)/name" };
}

/**
 * サインアウト時に必ず通すべき後処理（Supabase signOut + RevenueCat reset）。
 * 退会フロー (deleteAccount) からも呼ばれることで、片方だけ後始末漏れを防ぐ。
 *
 * 注意: ローカル Zustand ストアの reset は呼ばない。それは画面側 (settings.tsx の
 * fullLocalWipe) の責務として明確に分離する。
 */
export async function performSignOutCleanup(): Promise<void> {
  try {
    await supabaseSignOut();
  } catch (e) {
    console.warn("[postSignIn] supabase.signOut 失敗:", errorMessage(e));
  }
  try {
    await resetRevenueCat();
  } catch (e) {
    console.warn("[postSignIn] resetRevenueCat 失敗:", errorMessage(e));
  }
  track("sign_out");
}
