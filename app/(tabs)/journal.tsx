import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useJournal, MOOD_LABELS, MOOD_MARKS, todayKey, nextMilestone, reachedMilestone, moodStats, type Mood } from "../../lib/journal";
import { haptics } from "../../lib/haptics";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Journal() {
  const { entries, upsert, getStreak } = useJournal();
  const today = todayKey();
  const todayEntry = entries[today];

  const [mood, setMood] = useState<Mood | null>(todayEntry ? todayEntry.mood : null);
  const [note, setNote] = useState(todayEntry?.note || "");

  const onSave = () => {
    if (mood === null) return;
    const prevStreak = useJournal.getState().getStreak();
    haptics.success();
    upsert(today, mood, note);
    // upsert は同期 set なので即座に最新 streak を取得できる
    const newStreak = useJournal.getState().getStreak();
    const reached = reachedMilestone(newStreak);
    if (reached && newStreak !== prevStreak) {
      haptics.success();
    }
  };

  const list = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  const streak = getStreak();
  const next = nextMilestone(streak);
  const reached = reachedMilestone(streak);
  const stats = moodStats(entries, 30);

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>EVENING REFLECTION</Text>
            <Text style={s.title}>振り返り</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.todayCard}>
            <Text style={s.todayLabel}>◆ 今日はどんな一日でしたか</Text>
            <Text style={s.todaySub}>気分を4段階で記録すると、連続記録が育ちます</Text>
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
            <Pressable style={s.saveBtn} onPress={onSave} disabled={mood === null}>
              <Text style={s.saveText}>記録する</Text>
            </Pressable>
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
                <Text style={s.streakNext}>次の節目: {next.title}（{next.description}）</Text>
              )}
            </View>
          </View>

          {stats.total > 0 && (
            <View style={s.statsCard}>
              <Text style={s.statsTitle}>過去30日の傾向</Text>
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
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 16, paddingBottom: 60 },

  todayCard: { backgroundColor: C.paper, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: C.paperBorder },
  todayLabel: { color: C.gold, fontSize: 9, letterSpacing: 4, textAlign: "center", fontFamily: F.serif },
  todaySub: { color: C.inkSub, fontSize: 11, textAlign: "center", marginTop: 6, fontFamily: F.serif },
  moodRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 18 },
  moodWrap: { alignItems: "center" },
  moodCircle: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: C.paperBorder, alignItems: "center", justifyContent: "center" },
  moodCircleOn: { backgroundColor: C.red, borderColor: C.red },
  moodMark: { color: C.ink, fontSize: 22, fontWeight: "500", fontFamily: F.serif },
  moodMarkOn: { color: C.white },
  moodLabel: { color: C.inkSub, fontSize: 9, marginTop: 6, letterSpacing: 1 },
  moodLabelOn: { color: C.red, fontWeight: "600" },
  noteInput: { backgroundColor: "rgba(184,150,86,0.1)", borderRadius: 10, padding: 12, marginTop: 16, fontSize: 12, color: C.ink, minHeight: 60, fontFamily: F.serif },
  saveBtn: { marginTop: 12, paddingVertical: 12, alignItems: "center", backgroundColor: C.red, borderRadius: 24 },
  saveText: { color: C.white, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },

  streakCard: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16, padding: 14, backgroundColor: C.white12, borderRadius: 14, borderWidth: 1, borderColor: C.whiteBorder },
  streakNum: { color: C.paper, fontSize: 30, fontWeight: "300", letterSpacing: 1 },
  streakLabel: { color: C.white, fontSize: 10, opacity: 0.85, letterSpacing: 2 },
  streakText: { color: C.white, fontSize: 12, marginTop: 2 },
  streakNext: { color: C.white, fontSize: 10, opacity: 0.8, marginTop: 4, fontFamily: F.serif },

  statsCard: { marginTop: 16, padding: 16, backgroundColor: C.white12, borderRadius: 14, borderWidth: 1, borderColor: C.whiteBorder },
  statsTitle: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 2, marginBottom: 12, fontFamily: F.serif },
  statsBars: { flexDirection: "row", justifyContent: "space-around", height: 110, alignItems: "flex-end" },
  statsBarCol: { alignItems: "center", flex: 1 },
  statsBarMark: { color: C.white, fontSize: 14, marginBottom: 4, fontFamily: F.serif },
  statsBarTrack: { width: 18, height: 70, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  statsBarFill: { width: "100%", backgroundColor: C.gold },
  statsBarCount: { color: C.white, fontSize: 10, opacity: 0.8, marginTop: 4, fontFamily: F.serif },
  historyTitle: { color: C.white, fontSize: 13, fontWeight: "500", letterSpacing: 3, marginTop: 24, marginBottom: 10, fontFamily: F.serif },
  empty: { color: C.white, fontSize: 12, opacity: 0.7, textAlign: "center", padding: 24 },
  historyRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 12, backgroundColor: C.white95, borderRadius: 12, borderWidth: 1, borderColor: C.paperBorder, marginBottom: 6 },
  historyMood: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, alignItems: "center", justifyContent: "center", marginTop: 2 },
  historyMoodOn: { backgroundColor: C.red, borderColor: C.red },
  historyMoodText: { color: C.ink, fontSize: 14, fontWeight: "500", fontFamily: F.serif },
  historyDate: { color: C.gold, fontSize: 11 },
  historyNote: { color: C.ink, fontSize: 12, marginTop: 2, lineHeight: 20 },
});
