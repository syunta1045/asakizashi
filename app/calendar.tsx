import { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useJournal, MOOD_LABELS, moodStats, longestStreakInRange, moodSparkline, type JournalEntry } from "../lib/journal";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
// 0=とても良い, 1=ふつう, 2=もやもや, 3=つらい
const MOOD_COLOR = ["#C26E70", "#B89656", "#8E86B0", "#5B7BA8"];

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function topMoodLine(counts: number[]): string {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return "";
  const maxIdx = counts.indexOf(Math.max(...counts));
  return `いちばん多いのは「${MOOD_LABELS[maxIdx]}」。`;
}

export default function Calendar() {
  const router = useRouter();
  const entries = useJournal((s) => s.entries);
  const streak = useJournal((s) => s.getStreak)();
  const now = new Date();

  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState<{ day: number; entry: JournalEntry | null } | null>(null);
  const { year, month } = cursor;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = now.getDate();

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const recordedThisMonth = Object.keys(entries).filter((k) => k.startsWith(monthPrefix)).length;

  const stats = moodStats(entries, 30);
  const longest = longestStreakInRange(entries, 30);
  const spark = moodSparkline(entries, 14);

  const goPrev = () => {
    haptics.select();
    setCursor((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 });
  };
  const goNext = () => {
    haptics.select();
    setCursor((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 });
  };
  const goToday = () => {
    haptics.light();
    setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };
  const onTapDay = (d: number) => {
    haptics.select();
    setSelected({ day: d, entry: entries[dayKey(year, month, d)] ?? null });
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>{year}年</Text>
            <Text style={s.title}>{month}月の記録</Text>
          </View>
          {!isCurrentMonth && (
            <Pressable onPress={goToday} accessibilityRole="button"><Text style={s.todayBtn}>今月</Text></Pressable>
          )}
        </View>

        <View style={s.navRow}>
          <Pressable onPress={goPrev} style={s.navBtn} accessibilityRole="button"><Text style={s.navText}>‹ 前月</Text></Pressable>
          <Pressable onPress={goNext} style={s.navBtn} accessibilityRole="button"><Text style={s.navText}>次月 ›</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.streakCard}>
            <View style={s.streakCol}>
              <Text style={s.streakNum}>{streak}</Text>
              <Text style={s.streakLabel}>連続記録</Text>
            </View>
            <View style={s.streakDivider} />
            <View style={s.streakCol}>
              <Text style={s.streakNum}>{recordedThisMonth}</Text>
              <Text style={s.streakLabel}>今月の記録</Text>
            </View>
            <View style={s.streakDivider} />
            <View style={s.streakCol}>
              <Text style={s.streakNum}>{longest}</Text>
              <Text style={s.streakLabel}>最長（30日）</Text>
            </View>
          </View>

          <View style={s.calCard}>
            <View style={s.weekRow}>
              {WEEKDAYS.map((w) => (<Text key={w} style={s.weekText}>{w}</Text>))}
            </View>
            <View style={s.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={`b-${i}`} style={s.cell} />;
                const e = entries[dayKey(year, month, d)];
                const isToday = isCurrentMonth && d === todayDay;
                return (
                  <Pressable key={`d-${d}`} style={s.cell} onPress={() => onTapDay(d)} accessibilityRole="button">
                    <View style={[s.dayCircle, isToday && s.dayToday]}>
                      <Text style={[s.dayText, isToday && s.dayTextOn]}>{d}</Text>
                    </View>
                    <View style={s.dot}>
                      {e ? <View style={[s.moodDot, { backgroundColor: MOOD_COLOR[e.mood] }]} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.legend}>
              {MOOD_LABELS.map((label, m) => (
                <View key={label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: MOOD_COLOR[m] }]} />
                  <Text style={s.legendText}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={s.sectionTitle}>直近14日の気分の波</Text>
          <View style={s.waveCard}>
            {stats.total === 0 ? (
              <Text style={s.empty}>まだ記録がありません。夜の振り返りから始めてみましょう。</Text>
            ) : (
              <>
                <View style={s.waveRow}>
                  {spark.map((m, i) => (
                    <View key={`w-${i}`} style={s.waveCol}>
                      {m === null
                        ? <View style={s.waveGap} />
                        : <View style={[s.waveDot, { backgroundColor: MOOD_COLOR[m] }]} />}
                    </View>
                  ))}
                </View>
                <Text style={s.waveNote}>過去30日で {stats.total} 日記録。{topMoodLine(stats.counts)}</Text>
              </>
            )}
          </View>

          <Pressable style={s.cta} onPress={() => router.push("/journal")} accessibilityRole="button">
            <Text style={s.ctaText}>今日の振り返りを書く ›</Text>
          </Pressable>
        </ScrollView>

        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <Pressable style={s.modalBg} onPress={() => setSelected(null)} accessibilityRole="button">
            {selected && (
              <View style={s.modalCard}>
                <Text style={s.modalDate}>{year}年 {month}月{selected.day}日</Text>
                {selected.entry ? (
                  <>
                    <View style={s.modalMoodRow}>
                      <View style={[s.legendDot, { width: 14, height: 14, borderRadius: 7, backgroundColor: MOOD_COLOR[selected.entry.mood] }]} />
                      <Text style={s.modalMood}>{MOOD_LABELS[selected.entry.mood]}</Text>
                    </View>
                    {selected.entry.note
                      ? <Text style={s.modalNote}>{selected.entry.note}</Text>
                      : <Text style={s.modalNoteEmpty}>ひとことの記録はありません。</Text>}
                  </>
                ) : (
                  <Text style={s.modalNoteEmpty}>この日の記録はまだありません。</Text>
                )}
              </View>
            )}
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 10 },
  back: { color: C.white, fontSize: 22 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 3, marginTop: 4, fontFamily: F.serif },
  todayBtn: { color: C.white, fontSize: 12, opacity: 0.9, fontWeight: "700" },

  navRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 6 },
  navBtn: { paddingVertical: 6, paddingHorizontal: 8 },
  navText: { color: C.white, fontSize: 12, opacity: 0.9, fontWeight: "700", fontFamily: F.serif },

  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 12 },

  streakCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF8EA", borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  streakCol: { flex: 1, alignItems: "center" },
  streakDivider: { width: 1, height: 32, backgroundColor: "rgba(126,88,48,0.16)" },
  streakNum: { color: C.red, fontSize: 26, fontWeight: "800", fontFamily: F.serif },
  streakLabel: { color: "#9A6D2C", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 4 },

  calCard: { backgroundColor: "#FFF8EA", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  weekRow: { flexDirection: "row", marginBottom: 8 },
  weekText: { width: `${100 / 7}%`, textAlign: "center", color: "#9A6D2C", fontSize: 10, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dayToday: { borderWidth: 1.5, borderColor: C.red },
  dayText: { color: C.ink, fontSize: 13, fontFamily: F.serif },
  dayTextOn: { color: C.red, fontWeight: "800" },
  dot: { height: 8, marginTop: 2, alignItems: "center", justifyContent: "center" },
  moodDot: { width: 6, height: 6, borderRadius: 3 },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(126,88,48,0.14)", justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#574740", fontSize: 10, fontWeight: "700" },

  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 2, marginTop: 10, paddingHorizontal: 4, fontFamily: F.serif },
  waveCard: { backgroundColor: "#FFF8EA", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  waveRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 28 },
  waveCol: { flex: 1, alignItems: "center" },
  waveDot: { width: 12, height: 12, borderRadius: 6 },
  waveGap: { width: 12, height: 2, borderRadius: 1, backgroundColor: "rgba(126,88,48,0.18)" },
  waveNote: { color: C.inkSub, fontSize: 11, lineHeight: 18, marginTop: 12, fontWeight: "600", fontFamily: F.serif, textAlign: "center" },
  empty: { color: C.inkSub, fontSize: 12, lineHeight: 20, textAlign: "center", fontWeight: "600", fontFamily: F.serif },

  cta: { marginTop: 2, paddingVertical: 14, alignItems: "center", borderRadius: 24, backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  ctaText: { color: C.red, fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },

  modalBg: { flex: 1, backgroundColor: "rgba(20,16,30,0.5)", alignItems: "center", justifyContent: "center", padding: 32 },
  modalCard: { width: "100%", backgroundColor: "#FFF8EA", borderRadius: 16, padding: 22, borderWidth: 1, borderColor: "rgba(126,88,48,0.2)" },
  modalDate: { color: C.gold, fontSize: 12, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  modalMoodRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  modalMood: { color: C.ink, fontSize: 18, fontWeight: "800", fontFamily: F.serif },
  modalNote: { color: "#574740", fontSize: 13, lineHeight: 22, marginTop: 12, fontWeight: "600" },
  modalNoteEmpty: { color: C.inkMuted, fontSize: 12, lineHeight: 20, marginTop: 12, fontWeight: "600" },
});
