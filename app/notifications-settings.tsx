import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../lib/store";
import { useSubscription, isLocked } from "../lib/subscription";
import { requestNotificationPermission, scheduleMorningNotification, cancelAllNotifications } from "../lib/notifications";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

const EVENING_TIMES = ["19:00", "20:00", "21:00", "22:00", "23:00"];

export default function NotificationsSettings() {
  const router = useRouter();
  const u = useUser();
  const { isPremium } = useSubscription();
  const [granted, setGranted] = useState(false);
  const customTimeLocked = isLocked("customNotificationTime", isPremium);

  useEffect(() => {
    requestNotificationPermission().then(setGranted);
  }, []);

  const reschedule = async (overrides: Partial<typeof u> = {}) => {
    const merged = { ...u, ...overrides };
    await scheduleMorningNotification(merged.wakeUpTime, merged.nickname, {
      morningEnabled: merged.morningEnabled,
      eveningEnabled: merged.eveningEnabled,
      eveningTime: merged.eveningTime,
    });
  };

  const onToggleMorning = async (v: boolean) => {
    haptics.select();
    u.setField("morningEnabled", v);
    await reschedule({ morningEnabled: v });
  };
  const onToggleEvening = async (v: boolean) => {
    haptics.select();
    u.setField("eveningEnabled", v);
    await reschedule({ eveningEnabled: v });
  };
  const onPickEveningTime = async (t: string) => {
    haptics.light();
    u.setField("eveningTime", t);
    await reschedule({ eveningTime: t });
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>NOTIFICATIONS</Text>
            <Text style={s.title}>通知の設定</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {!granted && (
            <View style={s.warn}>
              <Text style={s.warnText}>
                通知の許可が無効になっています。{"\n"}
                スマートフォンの設定から旭兆の通知を有効にしてください。
              </Text>
            </View>
          )}

          {/* 朝の通知 */}
          <View style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>朝のお告げ</Text>
                <Text style={s.rowSub}>起床時刻の10分後（{notifyTimeFrom(u.wakeUpTime)}）に届きます</Text>
              </View>
              <Switch value={u.morningEnabled} onValueChange={onToggleMorning} trackColor={{ true: C.red, false: "#ccc" }} />
            </View>
          </View>

          {/* 夜の通知 */}
          <View style={s.card}>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>夜の振り返りリマインダー</Text>
                <Text style={s.rowSub}>{u.eveningTime} に届きます</Text>
              </View>
              <Switch value={u.eveningEnabled} onValueChange={onToggleEvening} trackColor={{ true: C.red, false: "#ccc" }} />
            </View>

            {u.eveningEnabled && (
              <>
                {customTimeLocked ? (
                  <View style={{ padding: 12, backgroundColor: "rgba(184,150,86,0.1)", borderRadius: 10 }}>
                    <Text style={s.lockText}>通知時刻のカスタムはプレミアム限定</Text>
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

  timeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  timeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, backgroundColor: C.paper },
  timeChipOn: { borderColor: C.red, backgroundColor: "rgba(158,47,47,0.08)" },
  timeChipText: { color: C.ink, fontSize: 12, fontFamily: F.serif },
  timeChipTextOn: { color: C.red, fontWeight: "600" },

  lockText: { color: C.inkSub, fontSize: 11, fontFamily: F.serif },

  dangerBtn: { marginTop: 16, padding: 14, alignItems: "center" },
  dangerText: { color: C.warn, fontSize: 12, letterSpacing: 2 },
});
