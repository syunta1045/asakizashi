import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { restoreSession } from "../lib/sync";
import { registerPushToken, ensureNotificationsScheduled } from "../lib/notifications";
import { track } from "../lib/analytics";
import { initSentry, wrap } from "../lib/sentry";
import { useSubscription } from "../lib/subscription";
import { checkEntitlementState, ensureRevenueCatConfigured } from "../lib/revenuecat";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { OfflineBanner } from "../components/OfflineBanner";
import { useUser } from "../lib/store";

// Sentry はモジュールロード時に初期化（DSN 未設定時は no-op）
initSentry();

// ネイティブスプラッシュがアプリ画面に重なって見えないよう、フェードなしで閉じる
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 0, fade: false });

function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isOnboarded = useUser((s) => s.isOnboarded);
  // pillars は使用しない（ナビゲーション分岐から外したため）
  const hasHydrated = useUser((s) => s.hasHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      track("app_opened");
      // トライアル期限切れを起動時に判定
      useSubscription.getState().checkTrialExpiry();
      try { await restoreSession(); } catch {}
      // RevenueCat 初期化（未ログインなら匿名ID、ログイン済みなら Supabase user.id）
      // 失敗しても起動は止めないが、無音で握りつぶさず可観測化する
      ensureRevenueCatConfigured()
        .then(async (r) => {
          if (!r.ok && r.error && r.error !== "未設定") {
            console.warn("[RevenueCat] 起動時初期化失敗:", r.error);
            track("revenuecat_init_failed", { reason: r.error, phase: "boot" });
            return;
          }
          if (r.ok) {
            const entitlement = await checkEntitlementState();
            useSubscription.getState().applyEntitlement(entitlement.active, entitlement.plan);
          }
        })
        .catch((e) => {
          console.warn("[RevenueCat] 起動時初期化例外:", e);
          track("revenuecat_init_failed", { reason: String(e), phase: "boot" });
        });
      // プッシュトークン登録（fire-and-forget、未許可でも続行）
      registerPushToken().catch(() => {});
      await SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || !hasHydrated || !isOnboarded) return;
    // ローカル通知の safety net: 永続化データ復元後に、欠けた予約だけ復旧する
    ensureNotificationsScheduled()
      .then((r) => {
        if (r.rescheduled) track("notifications_rescheduled");
        else if (!r.ok) console.warn("[notifications] ensure 失敗:", r.reason);
      })
      .catch((e) => console.warn("[notifications] ensure 例外:", e));
  }, [ready, hasHydrated, isOnboarded]);

  useEffect(() => {
    if (!ready || !hasHydrated) return;
    const first = segments[0];
    const protectedRoots = new Set([
      "(tabs)",
      "today",
      "journal",
      "calendar",
      "chart",
      "relations",
      "settings",
      "premium",
      "edit",
      "notifications-settings",
    ]);
    // 生年月日（pillars）はオプション。isOnboarded だけでホームへ進める。
    if (isOnboarded && (!first || first === "welcome")) {
      router.replace("/today");
      return;
    }
    if (!isOnboarded && first && protectedRoots.has(first)) {
      router.replace("/welcome");
    }
  }, [ready, hasHydrated, isOnboarded, router, segments]);

  // フォアグラウンド復帰時にも期限切れ判定（長時間バックグラウンド対策）
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        useSubscription.getState().checkTrialExpiry();
        ensureRevenueCatConfigured()
          .then(async (r) => {
            if (r.ok) {
              const entitlement = await checkEntitlementState();
              useSubscription.getState().applyEntitlement(entitlement.active, entitlement.plan);
            }
          })
          .catch(() => {});
        ensureNotificationsScheduled()
          .then((r) => {
            if (r.rescheduled) track("notifications_rescheduled");
          })
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // 通知タップによる遷移ハンドラ（コールドスタート / 起動中 両対応）
  // getLastNotificationResponseAsync は再起動のたびに同じ応答を返すため、
  // 処理済 identifier を AsyncStorage に保存して2回目以降は無視する。
  useEffect(() => {
    const HANDLED_KEY = "asakizashi:lastHandledNotifId";
    const navigateFor = (data: { deeplink?: string } | undefined) => {
      if (data?.deeplink === "asakizashi://today") router.push("/today");
      else if (data?.deeplink === "asakizashi://journal") router.push("/journal");
    };
    const handleColdStart = async (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      const lastHandled = await AsyncStorage.getItem(HANDLED_KEY).catch(() => null);
      if (lastHandled === id) return; // 同じ通知の再起動による再発火 → 無視
      await AsyncStorage.setItem(HANDLED_KEY, id).catch(() => {});
      navigateFor(response.notification.request.content.data as { deeplink?: string });
    };
    const handleLive = (response: Notifications.NotificationResponse) => {
      // ライブ受信は同一 identifier の重複発火が無いので、識別子保存だけ行って遷移
      const id = response.notification.request.identifier;
      AsyncStorage.setItem(HANDLED_KEY, id).catch(() => {});
      navigateFor(response.notification.request.content.data as { deeplink?: string });
    };
    Notifications.getLastNotificationResponseAsync().then(handleColdStart).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(handleLive);
    return () => sub.remove();
  }, []);

  if (!ready || !hasHydrated) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OfflineBanner />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Sentry.wrap で自動的にナビゲーション計測等をフック
export default wrap(RootLayout);
