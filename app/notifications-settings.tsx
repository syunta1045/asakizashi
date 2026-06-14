import { useEffect, useState } from "react";
import { Alert, View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../lib/store";
import { useSubscription, isLocked } from "../lib/subscription";
import {
  getNotificationPermissionGranted,
  requestNotificationPermission,
  scheduleMorningNotification,
  cancelAllNotifications,
  getNotificationScheduleState,
  scheduleTestNotification,
} from "../lib/notifications";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

const EVENING_TIMES = ["19:00", "20:00", "21:00", "22:00", "23:00"];

export default function NotificationsSettings() {
  const router = useRouter();
  const u = useUser();
  const { isPremium } = useSubscription();
  const [granted, setGranted] = useState(false);
  const [scheduleState, setScheduleState] = useState({
    scheduledCount: 0,
    morningScheduled: false,
    eveningScheduled: false,
  });
  const customTimeLocked = isLocked("customNotificationTime", isPremium);

  const refreshScheduleState = async () => {
    const state = await getNotificationScheduleState();
    setGranted(state.granted);
    setScheduleState({
      scheduledCount: state.scheduledCount,
      morningScheduled: state.morningScheduled,
      eveningScheduled: state.eveningScheduled,
    });
  };

  useEffect(() => {
    getNotificationPermissionGranted().then(setGranted);
    refreshScheduleState().catch(() => {});
  }, []);

  const ensureNotificationPermission = async () => {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    return ok;
  };

  const reschedule = async (overrides: Partial<typeof u> = {}) => {
    const merged = { ...u, ...overrides };
    await scheduleMorningNotification(merged.wakeUpTime, merged.nickname, {
      morningEnabled: merged.morningEnabled,
      eveningEnabled: merged.eveningEnabled,
      eveningTime: merged.eveningTime,
    });
    await refreshScheduleState();
  };

  const onToggleMorning = async (v: boolean) => {
    haptics.select();
    if (v) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        u.setField("morningEnabled", false);
        return;
      }
    }
    u.setField("morningEnabled", v);
    await reschedule({ morningEnabled: v });
  };
  const onToggleEvening = async (v: boolean) => {
    haptics.select();
    if (v) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        u.setField("eveningEnabled", false);
        return;
      }
    }
    u.setField("eveningEnabled", v);
    await reschedule({ eveningEnabled: v });
  };
  const onPickEveningTime = async (t: string) => {
    haptics.light();
    u.setField("eveningTime", t);
    await reschedule({ eveningTime: t });
  };

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>通知</Text>
            <Text style={s.title}>通知の設定</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {!granted && (
            <View style={s.warn}>
              <Text style={s.warnText}>
                通知の許可が無効になっています。{"\n"}
                スマートフォンの設定から朝しるべの通知を有効にしてください。
              </Text>
            </View>
          )}

          {/* 朝の通知 */}
          <View style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>朝メモを受け取る</Text>
                <Text style={s.rowSub}>起床の10分後（{notifyTimeFrom(u.wakeUpTime)}）に、朝のメモが届きます</Text>
              </View>
              <Switch value={granted && u.morningEnabled} onValueChange={onToggleMorning} trackColor={{ true: C.red, false: "#ccc" }} />
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.rowTitle}>予約状況</Text>
            <Text style={s.rowSub}>
              今朝の朝メモ: {scheduleState.morningScheduled ? "設定済み" : "受け取らない"}
              {"\n"}夜の振り返り: {scheduleState.eveningScheduled ? "設定済み" : "受け取らない"}
            </Text>
            <View style={s.actionRow}>
              <Pressable
                style={s.secondaryBtn}
                onPress={async () => {
                  haptics.light();
                  const ok = await ensureNotificationPermission();
                  if (!ok) return;
                  await reschedule();
                  Alert.alert("通知の予定を更新しました", "朝と夜の通知を、今の設定に合わせました。");
                }}
                accessibilityRole="button"
              >
                <Text style={s.secondaryText}>予定を合わせる</Text>
              </Pressable>
              <Pressable
                style={s.secondaryBtn}
                onPress={async () => {
                  haptics.light();
                  const ok = await scheduleTestNotification();
                  await refreshScheduleState();
                  if (ok) Alert.alert("ためし通知を予約しました", "約1分後に届きます。");
                }}
                accessibilityRole="button"
              >
                <Text style={s.secondaryText}>通知をためしてみる</Text>
              </Pressable>
            </View>
          </View>

          {/* 夜の通知 */}
          <View style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>夜に振り返る</Text>
                <Text style={s.rowSub}>{u.eveningTime} に、一日を記録する合図が届きます</Text>
              </View>
              <Switch value={granted && u.eveningEnabled} onValueChange={onToggleEvening} trackColor={{ true: C.red, false: "#ccc" }} />
            </View>

            {u.eveningEnabled && (
              <>
                {customTimeLocked ? (
                  <View style={{ padding: 12, backgroundColor: "rgba(184,150,86,0.1)", borderRadius: 10 }}>
                    <Text style={s.lockText}>通知時間の調整はプレミアム限定です</Text>
                  </View>
                ) : (
                  <View style={s.timeRow}>
                    {EVENING_TIMES.map((t) => (
                      <Pressable key={t} onPress={() => onPickEveningTime(t)} style={[s.timeChip, u.eveningTime === t && s.timeChipOn]} accessibilityRole="button">
                        <Text style={[s.timeChipText, u.eveningTime === t && s.timeChipTextOn]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* 全通知オフ */}
          <Pressable
            style={s.dangerBtn}
            onPress={async () => {
              haptics.warning();
              await cancelAllNotifications();
              u.setField("morningEnabled", false);
              u.setField("eveningEnabled", false);
              await refreshScheduleState();
            }}
          accessibilityRole="button">
            <Text style={s.dangerText}>すべての通知を停止</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  back: { color: C.white, fontSize: 22 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 12 },

  warn: { padding: 14, backgroundColor: C.warn, borderRadius: 12 },
  warnText: { color: C.white, fontSize: 12, lineHeight: 20, fontFamily: F.serif },

  card: { backgroundColor: C.white95, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.paperBorder, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowTitle: { color: C.ink, fontSize: 14, fontWeight: "600", fontFamily: F.serif },
  rowSub: { color: C.inkSub, fontSize: 11, marginTop: 4, fontFamily: F.serif },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  secondaryBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: C.paperBorder, backgroundColor: C.paper },
  secondaryText: { color: C.ink, fontSize: 11, fontWeight: "600", fontFamily: F.serif },

  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, backgroundColor: C.paper },
  timeChipOn: { borderColor: C.red, backgroundColor: "rgba(158,47,47,0.08)" },
  timeChipText: { color: C.ink, fontSize: 12, fontFamily: F.serif },
  timeChipTextOn: { color: C.red, fontWeight: "600" },

  lockText: { color: C.inkSub, fontSize: 11, fontFamily: F.serif },

  dangerBtn: { marginTop: 16, padding: 14, alignItems: "center" },
  dangerText: { color: C.warn, fontSize: 12, letterSpacing: 2 },
});
