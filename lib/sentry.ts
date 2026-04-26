/**
 * Sentry 統合
 *
 * 本番ビルドのみ初期化される（開発時はコンソール出力）。
 * DSN は EXPO_PUBLIC_SENTRY_DSN で設定。未設定なら no-op。
 */
import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const isSentryConfigured = Boolean(DSN);

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (__DEV__) {
    initialized = true;
    return;
  }
  if (!DSN) {
    console.warn("[sentry] EXPO_PUBLIC_SENTRY_DSN 未設定のため無効");
    return;
  }
  Sentry.init({
    dsn: DSN,
    // パフォーマンス計測（軽め）
    tracesSampleRate: 0.1,
    // セッションリプレイは PII の都合で無効
    enableNativeCrashHandling: true,
    // OOM 等の生データはサンプル絞る
    sendDefaultPii: false,
  });
  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error("[sentry stub]", error, context);
    return;
  }
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (__DEV__) {
    console.log(`[sentry stub] ${level}: ${message}`);
    return;
  }
  if (!initialized) return;
  Sentry.captureMessage(message, level);
}

export function setUser(userId: string | null) {
  if (__DEV__) {
    console.log(`[sentry stub] setUser: ${userId}`);
    return;
  }
  if (!initialized) return;
  Sentry.setUser(userId ? { id: userId } : null);
}

/**
 * ErrorBoundary から最上位を Sentry でラップしたい場合に使用。
 * 例: export default Sentry.wrap(RootLayout);
 */
export const wrap = Sentry.wrap;
