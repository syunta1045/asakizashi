import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, StyleSheet, Keyboard } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useJournal, MOOD_LABELS, MOOD_MARKS, todayKey, nextMilestone, reachedMilestone, moodStats, moodAverage, moodTrend, moodByWeekday, moodSparkline, longestStreakInRange, type Mood } from "../../lib/journal";
import { haptics } from "../../lib/haptics";
import { C, morningGradient, F } from "../../lib/theme";

export default function Journal() {
  const { entries, upsert, getStreak } = useJournal();
  const today = todayKey();
  const todayEntry = entries[today];

  const [mood, setMood] = useState<Mood | null>(todayEntry ? todayEntry.mood : null);
  const [note, setNote] = useState(todayEntry?.note || "");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const saveFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // マイルストーン達成時のお祝いダイアログ
  const [celebrate, setCelebrate] = useState<{ title: string; description: string } | null>(null);

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
    const reached = reachedMilestone(newStreak);
    if (reached && newStreak !== prevStreak) {
      haptics.success();
      setCelebrate({
        title: reached.title,
        description: `${newStreak}日 続いています`,
      });
    }
  };

  const list = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const streak = getStreak();
  const next = nextMilestone(streak);
  const reached = reachedMilestone(streak);
  const stats = moodStats(entries, 30);
  const avg = moodAverage(entries, 30);
  const trend = moodTrend(entries);
  const weekday = moodByWeekday(entries, 30);
  const sparkline = moodSparkline(entries, 14);
  const longest = longestStreakInRange(entries, 30);
  const recordRate = Math.round((stats.total / 30) * 100);

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

          {stats.total > 0 && (
            <View style={s.statsCard}>
              <Text style={s.statsTitle}>過去30日の傾向</Text>

              {/* サマリー数値 */}
              <View style={s.summaryRow}>
                <View style={s.summaryCell}>
                  <Text style={s.summaryNum}>{stats.total}</Text>
                  <Text style={s.summaryLabel}>記録日数</Text>
                </View>
                <View style={s.summaryDiv} />
                <View style={s.summaryCell}>
                  <Text style={s.summaryNum}>{recordRate}%</Text>
                  <Text style={s.summaryLabel}>記録率</Text>
                </View>
                <View style={s.summaryDiv} />
                <View style={s.summaryCell}>
                  <Text style={s.summaryNum}>{longest}</Text>
                  <Text style={s.summaryLabel}>最長連続</Text>
                </View>
              </View>

              {/* 平均気分 + 直近7日 vs 前7日のトレンド */}
              <View style={s.trendBlock}>
                <Text style={s.trendLine}>
                  平均気分： <Text style={s.trendValue}>{avgLabel(avg.avg)}</Text>
                </Text>
                {trend.currentN > 0 && trend.previousN > 0 && (
                  <Text style={s.trendLine}>
                    直近7日：{trendArrow(trend.diff)}
                    <Text style={[s.trendValue, { color: trendColor(trend.diff) }]}>
                      {trendDescription(trend.diff)}
                    </Text>
                  </Text>
                )}
              </View>

              {/* 直近14日のミニチャート */}
              <View style={s.sparkBlock}>
                <Text style={s.sparkLabel}>直近14日の気分推移</Text>
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
                  <Text style={s.sparkAxisLabel}>2週前</Text>
                  <Text style={s.sparkAxisLabel}>今日</Text>
                </View>
              </View>

              {/* mood 分布バー */}
              <View style={s.statsBars}>
                {MOOD_MARKS.map((m, i) => {
                  const count = stats.counts[i];
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <View key={i} style={s.statsBarCol}>
                      <Text style={s.statsBarMark}>{m}</Text>
                      <View style={s.statsBarTrack}>
                        <View style={[s.statsBarFill, { height: `${pct}%` }, i === 0 && { backgroundColor: C.red }, i === 3 && { backgroundColor: C.warn }]} />
                      </View>
                      <Text style={s.statsBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>

              {/* 曜日別パターン */}
              {weekday.counts.some((c) => c > 0) && (
                <View style={s.weekdayBlock}>
                  <Text style={s.weekdayLabel}>曜日別の気分</Text>
                  <View style={s.weekdayRow}>
                    {["日","月","火","水","木","金","土"].map((d, i) => {
                      const cnt = weekday.counts[i];
                      const a = cnt > 0 ? weekday.sums[i] / cnt : -1;
                      return (
                        <View key={i} style={s.weekdayCell}>
                          <Text style={[s.weekdayDay, i === 0 && { color: C.warn }, i === 6 && { color: C.gold }]}>{d}</Text>
                          <View style={[s.weekdayMark, weekdayBgFromAvg(a)]}>
                            <Text style={s.weekdayMarkText}>{a < 0 ? "—" : weekdayMoodFace(a)}</Text>
                          </View>
                          <Text style={s.weekdayCount}>{cnt}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
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
        onRequestClose={() => setCelebrate(null)}
      >
        <Pressable style={s.celebBg} onPress={() => setCelebrate(null)} accessibilityLabel="閉じる">
          <View style={s.celebCard}>
            <Text style={s.celebSparkle}>✦   ☀   ✦</Text>
            <Text style={s.celebTitle}>{celebrate?.title}</Text>
            <Text style={s.celebDesc}>{celebrate?.description}</Text>
            <View style={s.celebDivider} />
            <Text style={s.celebMessage}>
              続けることで、あなたの日々の調子が{"\n"}少しずつ見えやすくなります。
            </Text>
            <Pressable style={s.celebClose} onPress={() => setCelebrate(null)} accessibilityRole="button">
              <Text style={s.celebCloseText}>ありがとう</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

function avgLabel(avg: number): string {
  if (avg < 0.5) return "とても良い";
  if (avg < 1.3) return "良い〜ふつう";
  if (avg < 2.0) return "ふつう";
  if (avg < 2.7) return "やや疲れ気味";
  return "つらい日が多め";
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

function weekdayMoodFace(avg: number): string {
  // avg は 0..3、低いほど良い
  if (avg < 0.7) return "◎";
  if (avg < 1.5) return "○";
  if (avg < 2.3) return "△";
  return "✕";
}

function weekdayBgFromAvg(avg: number) {
  if (avg < 0) return { backgroundColor: "rgba(255,255,255,0.10)" };
  if (avg < 0.7) return { backgroundColor: "rgba(168,30,30,0.85)" }; // C.red 系
  if (avg < 1.5) return { backgroundColor: "rgba(184,150,86,0.7)" };
  if (avg < 2.3) return { backgroundColor: "rgba(255,255,255,0.25)" };
  return { backgroundColor: "rgba(180,80,80,0.5)" };
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

  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
  summaryCell: { flex: 1, alignItems: "center" },
  summaryDiv: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.18)" },
  summaryNum: { color: C.white, fontSize: 22, fontWeight: "300", fontFamily: F.serif },
  summaryLabel: { color: C.white, fontSize: 9, opacity: 0.7, letterSpacing: 1, marginTop: 2 },

  trendBlock: { paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", gap: 4 },
  trendLine: { color: C.white, fontSize: 12, fontFamily: F.serif },
  trendValue: { color: C.white, fontWeight: "600" },

  sparkBlock: { paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)" },
  sparkLabel: { color: C.white, fontSize: 10, opacity: 0.85, letterSpacing: 2, marginBottom: 8 },
  sparkRow: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 40, paddingTop: 4 },
  sparkCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: 36 },
  sparkDot: { width: 12, borderRadius: 2, height: 8 },
  sparkDotEmpty: { backgroundColor: "rgba(255,255,255,0.15)" },
  sparkAxis: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sparkAxisLabel: { color: C.white, fontSize: 9, opacity: 0.6 },

  weekdayBlock: { paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", marginTop: 10 },
  weekdayLabel: { color: C.white, fontSize: 10, opacity: 0.85, letterSpacing: 2, marginBottom: 8 },
  weekdayRow: { flexDirection: "row", justifyContent: "space-between" },
  weekdayCell: { alignItems: "center", flex: 1 },
  weekdayDay: { color: C.white, fontSize: 10, opacity: 0.85, marginBottom: 4, fontFamily: F.serif },
  weekdayMark: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.15)" },
  weekdayMarkText: { color: C.white, fontSize: 14, fontFamily: F.serif },
  weekdayCount: { color: C.white, fontSize: 9, opacity: 0.6, marginTop: 2 },

  statsBars: { flexDirection: "row", justifyContent: "space-around", height: 110, alignItems: "flex-end", marginTop: 4 },
  statsBarCol: { alignItems: "center", flex: 1 },
  statsBarMark: { color: C.white, fontSize: 14, marginBottom: 4, fontFamily: F.serif },
  statsBarTrack: { width: 18, height: 70, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  statsBarFill: { width: "100%", backgroundColor: C.gold },
  statsBarCount: { color: C.white, fontSize: 10, opacity: 0.8, marginTop: 4, fontFamily: F.serif },
  historyTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 3, marginTop: 24, marginBottom: 10, fontFamily: F.serif },
  empty: { color: C.white, fontSize: 12, opacity: 0.7, textAlign: "center", padding: 24 },
  historyRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 13, backgroundColor: "#FFF8EA", borderRadius: 12, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", marginBottom: 7 },
  historyMood: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, alignItems: "center", justifyContent: "center", marginTop: 2 },
  historyMoodOn: { backgroundColor: C.red, borderColor: C.red },
  historyMoodText: { color: C.ink, fontSize: 14, fontWeight: "500", fontFamily: F.serif },
  historyDate: { color: C.gold, fontSize: 11 },
  historyNote: { color: C.ink, fontSize: 12, marginTop: 2, lineHeight: 20 },
});
