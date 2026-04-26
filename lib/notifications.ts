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
    const { status: req } = await Notifications.requestPermissionsAsync();
    status = req;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("morning", {
      name: "朝のお告げ",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }

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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "旭兆",
        body: `${nickname || "あなた"}さんへの今朝のお告げが届いています`,
        sound: "default",
        data: { deeplink: "asakizashi://today" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: h, minute: m, repeats: true,
      },
    });
  }

  if (eveningEnabled) {
    const [eh, em] = eveningTime.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "旭兆",
        body: "今日はどんな一日でしたか？少しだけ振り返ってみませんか",
        sound: "default",
        data: { deeplink: "asakizashi://journal" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: eh, minute: em, repeats: true,
      },
    });
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
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
