/**
 * 朝の通知（ローカル通知）
 *
 * MVP: ローカルスケジュールのみ。
 * 本番: Supabase Cron + Expo Push API でサーバー側からプッシュ。
 */
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { notifyTimeFrom } from "./store";
import { errorMessage } from "./errors";
import { supabase, getSession } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== "granted") {
    const { status: req } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
    status = req;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("morning", {
      name: "朝メモ",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

  return status === "granted";
}

export async function getNotificationPermissionGranted(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

/**
 * 起床時刻+10分に朝の通知 + 任意の時間に振り返りリマインダー。
 * options を省略した場合はユーザーストア (useUser) の現在値を読み出して反映する。
 * 「再スケジュールでユーザー設定を踏み潰す」事故を防ぐ。
 */
export async function scheduleMorningNotification(
  wakeUpTime: string,
  nickname: string,
  options: { morningEnabled?: boolean; eveningEnabled?: boolean; eveningTime?: string } = {}
) {
  // 動的 import で循環依存を回避
  const { useUser } = await import("./store");
  const u = useUser.getState();
  const morningEnabled = options.morningEnabled ?? u.morningEnabled;
  const eveningEnabled = options.eveningEnabled ?? u.eveningEnabled;
  const eveningTime = options.eveningTime ?? u.eveningTime ?? "21:00";
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (morningEnabled) {
    const notify = notifyTimeFrom(wakeUpTime);
    const [h, m] = notify.split(":").map(Number);
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "朝しるべ",
          body: `おはよう、${nickname || "あなた"}さん。今朝の朝メモが届きました。`,
          sound: "default",
          data: { deeplink: "asakizashi://today" },
        },
        trigger: {
          channelId: "morning",
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
        },
      });
      console.log("[notifications] morning scheduled:", id, h, m);
    } catch (e) {
      console.warn("[notifications] morning schedule failed:", errorMessage(e));
    }
  }

  if (eveningEnabled) {
    const [eh, em] = eveningTime.split(":").map(Number);
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "朝しるべ",
          body: "今日はどんな一日でしたか？少しだけ振り返ってみませんか",
          sound: "default",
          data: { deeplink: "asakizashi://journal" },
        },
        trigger: {
          channelId: "morning",
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: eh,
          minute: em,
        },
      });
      console.log("[notifications] evening scheduled:", id, eh, em);
    } catch (e) {
      console.warn("[notifications] evening schedule failed:", errorMessage(e));
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function hasScheduledDeepLink(scheduled: Notifications.NotificationRequest[], deeplink: string) {
  return scheduled.some((n) => n.content.data?.deeplink === deeplink);
}

export async function getNotificationScheduleState(): Promise<{
  granted: boolean;
  scheduledCount: number;
  morningScheduled: boolean;
  eveningScheduled: boolean;
}> {
  if (!Device.isDevice) {
    return { granted: false, scheduledCount: 0, morningScheduled: false, eveningScheduled: false };
  }

  const { status } = await Notifications.getPermissionsAsync();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return {
    granted: status === "granted",
    scheduledCount: scheduled.length,
    morningScheduled: hasScheduledDeepLink(scheduled, "asakizashi://today"),
    eveningScheduled: hasScheduledDeepLink(scheduled, "asakizashi://journal"),
  };
}

export async function scheduleTestNotification(seconds = 60) {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "朝しるべ",
      body: "ためし通知です。朝メモもこのように届きます。",
      sound: "default",
      data: { deeplink: "asakizashi://today", test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });

  return true;
}

/**
 * 起動時の safety net: ユーザー設定で通知ON かつ OS 権限 granted なのに
 * 必要な通知予約が欠けている場合だけ、再スケジュールする。
 *
 * 想定ケース:
 *   - APK の上書きインストール後にスケジュールが消失した
 *   - OS のメンテで一時的にクリアされた
 *   - 何らかの理由で過去に schedule 失敗した
 *
 * オンボ未完了 / 権限未許可 / ユーザー設定で OFF のときは何もしない（黙って no-op）。
 */
export async function ensureNotificationsScheduled(): Promise<{ ok: boolean; rescheduled: boolean; reason?: string }> {
  if (!Device.isDevice) return { ok: true, rescheduled: false, reason: "not-device" };
  try {
    const { useUser } = await import("./store");
    const u = useUser.getState();
    // オンボ未完了
    if (!u.isOnboarded) return { ok: true, rescheduled: false, reason: "onboarding-incomplete" };
    // ユーザー設定が両方OFF
    if (!u.morningEnabled && !u.eveningEnabled) return { ok: true, rescheduled: false, reason: "user-disabled" };
    // 権限なし（黙って no-op、許可ダイアログは出さない）
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return { ok: true, rescheduled: false, reason: "permission-denied" };
    // 必要な通知が揃っていれば何もしない
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasMorning = !u.morningEnabled || hasScheduledDeepLink(scheduled, "asakizashi://today");
    const hasEvening = !u.eveningEnabled || hasScheduledDeepLink(scheduled, "asakizashi://journal");
    if (hasMorning && hasEvening) return { ok: true, rescheduled: false, reason: "already-scheduled" };
    // 再スケジュール
    await scheduleMorningNotification(u.wakeUpTime, u.nickname);
    return { ok: true, rescheduled: true };
  } catch (e: unknown) {
    return { ok: false, rescheduled: false, reason: errorMessage(e) };
  }
}

/**
 * Expo Push Token を取得して Supabase の push_tokens テーブルに登録。
 * サーバー側からプッシュ送信するために必要。
 */
export async function registerPushToken(): Promise<{ ok: boolean; token?: string; error?: string }> {
  if (!Device.isDevice) return { ok: false, error: "実機が必要です" };
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? (Constants as any)?.easConfig?.projectId;
    const tokenRes = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenRes.data;

    if (!supabase) return { ok: true, token };
    const session = await getSession();
    if (!session) return { ok: true, token };

    // Supabase に upsert
    const { data: u } = await supabase.from("users").select("id").eq("auth_id", session.user.id).maybeSingle();
    if (!u) return { ok: true, token };

    await supabase.from("push_tokens").upsert({
      user_id: u.id,
      token,
      platform: Platform.OS,
      last_used_at: new Date().toISOString(),
    }, { onConflict: "token" });

    return { ok: true, token };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}
