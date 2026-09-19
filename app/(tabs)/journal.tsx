import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, StyleSheet, Keyboard } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useJournal, MOOD_LABELS, MOOD_MARKS, todayKey, nextMilestone, reachedMilestone, moodTrend, moodSparkline, type Mood } from "../../lib/journal";
import { useUser } from "../../lib/store";
import { scheduleMorningNotification } from "../../lib/notifications";
import { haptics } from "../../lib/haptics";
import { maybeRequestReview } from "../../lib/review";
import { C, morningGradient, F } from "../../lib/theme";

export default function Journal() {
  const router = useRouter();
  const { entries, upsert, getStreak } = useJournal();
  const today = todayKey();
  const todayEntry = entries[today];

  const [mood, setMood] = useState<Mood | null>(todayEntry ? todayEntry.mood : null);
  const [note, setNote] = useState(todayEntry?.note || "");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const saveFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // マイルストーン達成時のお祝いダイアログ
  const [celebrate, setCelebrate] = useState<{ title: string; description: string; days: number } | null>(null);

  useEffect(() => {
    return () => {
      if (saveFeedbackTimer.current) clearTimeout(saveFeedbackTimer.current);
    };
  }, []);

  const onSave = () => {
    if (mood === null) return;
    Keyboard.dismiss();
    const prevStreak = useJournal.getState().getStreak();
    haptics.success();
    upsert(today, mood, note);
    setSaveFeedback(true);
    if (saveFeedbackTimer.current) clearTimeout(saveFeedbackTimer.current);
    saveFeedbackTimer.current = setTimeout(() => setSaveFeedback(false), 2600);
    const newStreak = useJournal.getState().getStreak();
    // 翌朝の通知に連続日数を差し込む（毎日同じ固定文からの脱却）
    const u = useUser.getState();
    scheduleMorningNotification(u.wakeUpTime, u.nickname, { streak: newStreak }).catch(() => {});
    const reached = reachedMilestone(newStreak);
    if (reached && newStreak !== prevStreak) {
      haptics.success();
      setCelebrate({
        title: reached.title,
        description: `${newStreak}日 続いています`,
        days: newStreak,
      });
    }
  };

  // お祝いを閉じる = 達成を見届けた高揚した瞬間。ここで（この版につき一度だけ）レビュー依頼。
  const dismissCelebrate = () => {
    setCelebrate(null);
    maybeRequestReview();
  };

  const list = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const streak = getStreak();
  const next = nextMilestone(streak);
  const reached = reachedMilestone(streak);
  const trend = moodTrend(entries);
  const sparkline = moodSparkline(entries, 7);
  const hasAnyEntry = Object.keys(entries).length > 0;

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>夜の振り返り</Text>
            <Text style={s.title}>振り返り</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.todayCard}>
            <Text style={s.todayLabel}>◆ 今日はどんな一日でしたか</Text>
            <Text style={s.todaySub}>毎日の気分を4段階で記録すると、連続記録が育ちます</Text>
            <View style={s.moodRow}>
              {MOOD_MARKS.map((m, i) => {
                const on = mood === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setMood(i as Mood)}
                    style={s.moodWrap}
                    accessibilityRole="radio"
                    accessibilityLabel={`気分: ${MOOD_LABELS[i]}`}
                    accessibilityState={{ selected: on }}
                  >
                    <View style={[s.moodCircle, on && s.moodCircleOn]}>
                      <Text style={[s.moodMark, on && s.moodMarkOn]}>{m}</Text>
                    </View>
                    <Text style={[s.moodLabel, on && s.moodLabelOn]}>{MOOD_LABELS[i]}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={s.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="今日のひとこと（任意）"
              placeholderTextColor={C.inkMuted}
              multiline
            />
            <Pressable
              style={[s.saveBtn, mood === null && s.saveBtnDisabled, saveFeedback && s.saveBtnDone]}
              onPress={onSave}
              disabled={mood === null}
              accessibilityRole="button"
              accessibilityState={{ disabled: mood === null }}
            >
              <Text style={[s.saveText, saveFeedback && s.saveTextDone]}>
                {saveFeedback ? "記録しました" : todayEntry ? "更新する" : "記録する"}
              </Text>
            </Pressable>
            {saveFeedback && (
              <Text style={s.saveFeedback}>今日の振り返りに保存しました</Text>
            )}
          </View>

          <View style={s.streakCard}>
            <Text style={s.streakNum}>{streak}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.streakLabel}>連続記録</Text>
              {reached ? (
                <Text style={s.streakText}>🌅 {reached.title} — {streak}日達成</Text>
              ) : (
                <Text style={s.streakText}>{streak}日続けて記録しています</Text>
              )}
              {next && (
                <Text style={s.streakNext}>次の目標: {next.title}（{next.description}）</Text>
              )}
            </View>
          </View>

          {hasAnyEntry && (
            <View style={s.statsCard}>
              <Text style={s.statsTitle}>直近7日</Text>

              <View style={s.sparkBlock}>
                <View style={s.sparkRow}>
                  {sparkline.map((m, i) => (
                    <View key={i} style={s.sparkCol}>
                      <View
                        style={[
                          s.sparkDot,
                          m === null && s.sparkDotEmpty,
                          m === 0 && { backgroundColor: C.red, height: 28 },
                          m === 1 && { backgroundColor: C.gold, height: 22 },
                          m === 2 && { backgroundColor: C.inkSub, height: 16 },
                          m === 3 && { backgroundColor: C.warn, height: 10 },
                        ]}
                      />
                    </View>
                  ))}
                </View>
                <View style={s.sparkAxis}>
                  <Text style={s.sparkAxisLabel}>1週前</Text>
                  <Text style={s.sparkAxisLabel}>今日</Text>
                </View>
              </View>

              {trend.currentN > 0 && trend.previousN > 0 && (
                <View style={s.trendBlock}>
                  <Text style={s.trendLine}>
                    先週と比べて：{trendArrow(trend.diff)}
                    <Text style={[s.trendValue, { color: trendColor(trend.diff) }]}>
                      {trendDescription(trend.diff)}
                    </Text>
                  </Text>
                </View>
              )}

              <Pressable style={s.lookbackRow} onPress={() => router.push("/lookback")} accessibilityRole="button">
                <Text style={s.lookbackText}>30日・90日の見返し ›</Text>
              </Pressable>
            </View>
          )}

          <Text style={s.historyTitle}>これまでの記録</Text>
          {list.length === 0 && <Text style={s.empty}>記録はまだありません</Text>}
          {list.map((e) => (
            <View key={e.date} style={s.historyRow}>
              <View style={[s.historyMood, e.mood === 0 && s.historyMoodOn]}>
                <Text style={[s.historyMoodText, e.mood === 0 && { color: C.white }]}>{MOOD_MARKS[e.mood]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.historyDate}>{e.date}</Text>
                <Text style={s.historyNote}>{e.note || "—"}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* マイルストーン達成のお祝い */}
      <Modal
        visible={!!celebrate}
        transparent
        animationType="fade"
        onRequestClose={dismissCelebrate}
      >
        <Pressable style={s.celebBg} onPress={dismissCelebrate} accessibilityLabel="閉じる">
          <View style={s.celebCard}>
            <Text style={s.celebSparkle}>✦   ☀   ✦</Text>
            <Text style={s.celebTitle}>{celebrate?.title}</Text>
            <Text style={s.celebDesc}>{celebrate?.description}</Text>
            <View style={s.celebDivider} />
            {celebrate && celebrate.days >= 7 && (
              <Pressable
                style={s.celebLookback}
                onPress={() => { setCelebrate(null); router.push("/lookback"); }}
                accessibilityRole="button"
              >
                {/* 無料は直近7日までなので、7日超のマイルストーンでは日数を約束しない */}
                <Text style={s.celebLookbackText}>
                  {celebrate.days === 7 ? "7日分の波を見る ›" : "気分の見返しへ ›"}
                </Text>
              </Pressable>
            )}
            <Pressable style={s.celebClose} onPress={dismissCelebrate} accessibilityRole="button">
              <Text style={s.celebCloseText}>ありがとう</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

function trendArrow(diff: number): string {
  if (diff < -0.3) return "↑ ";
  if (diff > 0.3) return "↓ ";
  return "→ ";
}

function trendDescription(diff: number): string {
  if (diff < -0.3) return "改善傾向";
  if (diff > 0.3) return "下がり気味";
  return "横ばい";
}

function trendColor(diff: number): string {
  if (diff < -0.3) return C.gold;
  if (diff > 0.3) return C.warn;
  return C.white;
}

const celebStyles = {
  celebBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center" as const, justifyContent: "center" as const, padding: 24 },
  celebCard: { backgroundColor: C.paper, borderRadius: 18, paddingVertical: 28, paddingHorizontal: 24, borderWidth: 1, borderColor: C.gold, alignItems: "center" as const, maxWidth: 360 },
  celebSparkle: { color: C.gold, fontSize: 14, letterSpacing: 8, marginBottom: 12 },
  celebTitle: { color: C.red, fontSize: 22, fontWeight: "600" as const, fontFamily: F.serif, letterSpacing: 4, textAlign: "center" as const },
  celebDesc: { color: C.ink, fontSize: 13, marginTop: 8, fontFamily: F.serif },
  celebDivider: { width: 60, height: 1, backgroundColor: C.gold, marginVertical: 18, opacity: 0.5 },
  celebMessage: { color: C.inkSub, fontSize: 12, lineHeight: 22, textAlign: "center" as const, fontFamily: F.serif },
  celebClose: { marginTop: 22, paddingHorizontal: 32, paddingVertical: 12, backgroundColor: C.red, borderRadius: 24 },
  celebCloseText: { color: C.white, fontSize: 13, fontWeight: "600" as const, letterSpacing: 4, fontFamily: F.serif },
  celebLookback: { marginTop: 18, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: C.red },
  celebLookbackText: { color: C.red, fontSize: 12, fontWeight: "700" as const, letterSpacing: 2, fontFamily: F.serif },
};

const s = StyleSheet.create({
  ...celebStyles,
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  dateLabel: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 3, fontWeight: "700" },
  title: { color: C.white, fontSize: 24, fontWeight: "800", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 18, paddingBottom: 64 },

  todayCard: { backgroundColor: "#FFF8EA", borderRadius: 16, padding: 22, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", shadowColor: "#42231A", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  todayLabel: { color: "#9A6D2C", fontSize: 10, letterSpacing: 3, textAlign: "center", fontFamily: F.serif, fontWeight: "800" },
  todaySub: { color: "#66554A", fontSize: 12, textAlign: "center", marginTop: 7, fontFamily: F.serif, fontWeight: "600" },
  moodRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 18 },
  moodWrap: { alignItems: "center" },
  moodCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: "rgba(126,88,48,0.2)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.36)" },
  moodCircleOn: { backgroundColor: C.red, borderColor: C.red },
  moodMark: { color: C.ink, fontSize: 22, fontWeight: "500", fontFamily: F.serif },
  moodMarkOn: { color: C.white },
  moodLabel: { color: C.inkSub, fontSize: 9, marginTop: 6, letterSpacing: 1 },
  moodLabelOn: { color: C.red, fontWeight: "600" },
  noteInput: { backgroundColor: "rgba(255,255,255,0.48)", borderRadius: 10, padding: 13, marginTop: 16, fontSize: 13, color: C.ink, minHeight: 68, fontFamily: F.serif, borderWidth: 1, borderColor: "rgba(126,88,48,0.1)" },
  saveBtn: { marginTop: 13, paddingVertical: 13, alignItems: "center", backgroundColor: C.red, borderRadius: 24 },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnDone: { backgroundColor: C.gold },
  saveText: { color: C.white, fontSize: 13, fontWeight: "800", letterSpacing: 4, fontFamily: F.serif },
  saveTextDone: { color: C.ink },
  saveFeedback: { color: C.red, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 9, fontWeight: "800", fontFamily: F.serif },

  streakCard: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16, padding: 15, backgroundColor: "rgba(255,248,234,0.28)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,248,234,0.38)" },
  streakNum: { color: "#FFF8EA", fontSize: 32, fontWeight: "800", letterSpacing: 1 },
  streakLabel: { color: "#FFF8EA", fontSize: 10, opacity: 0.95, letterSpacing: 2, fontWeight: "800" },
  streakText: { color: C.white, fontSize: 12, marginTop: 2, fontWeight: "700" },
  streakNext: { color: "#FFF8EA", fontSize: 10, opacity: 0.86, marginTop: 4, fontFamily: F.serif },

  statsCard: { marginTop: 16, padding: 16, backgroundColor: "rgba(255,248,234,0.22)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,248,234,0.34)" },
  statsTitle: { color: "#FFF8EA", fontSize: 11, opacity: 0.95, letterSpacing: 2, marginBottom: 12, fontFamily: F.serif, fontWeight: "800" },
  lookbackRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", alignItems: "center" },
  lookbackText: { color: "#FFF8EA", fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },

  trendBlock: { paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", gap: 4 },
  trendLine: { color: C.white, fontSize: 12, fontFamily: F.serif },
  trendValue: { color: C.white, fontWeight: "600" },

  sparkBlock: { paddingVertical: 10, paddingHorizontal: 4 },
  sparkRow: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 40, paddingTop: 4 },
  sparkCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: 36 },
  sparkDot: { width: 12, borderRadius: 2, height: 8 },
  sparkDotEmpty: { backgroundColor: "rgba(255,255,255,0.15)" },
  sparkAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sparkAxisLabel: { color: C.white, fontSize: 9, opacity: 0.6 },

  historyTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 3, marginTop: 24, marginBottom: 10, fontFamily: F.serif },
  empty: { color: C.white, fontSize: 12, opacity: 0.7, textAlign: "center", padding: 24 },
  historyRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 13, backgroundColor: "#FFF8EA", borderRadius: 12, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", marginBottom: 7 },
  historyMood: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, alignItems: "center", justifyContent: "center", marginTop: 2 },
  historyMoodOn: { backgroundColor: C.red, borderColor: C.red },
  historyMoodText: { color: C.ink, fontSize: 14, fontWeight: "500", fontFamily: F.serif },
  historyDate: { color: C.gold, fontSize: 11 },
  historyNote: { color: C.ink, fontSize: 12, marginTop: 2, lineHeight: 20 },
});
