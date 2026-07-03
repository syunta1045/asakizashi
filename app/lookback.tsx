import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useJournal,
  MOOD_LABELS,
  moodStats,
  moodTrend,
  moodByWeekday,
  moodSparkline,
  longestStreakInRange,
} from "../lib/journal";
import { useSubscription, isLocked } from "../lib/subscription";
import { PremiumLock } from "../components/PremiumLock";
import { track } from "../lib/analytics";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
// 0=とても良い, 1=ふつう, 2=もやもや, 3=つらい（calendar.tsx と同じ配色）
const MOOD_COLOR = ["#C26E70", "#B89656", "#8E86B0", "#5B7BA8"];

function topMoodLine(counts: number[]): string {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return "";
  const maxIdx = counts.indexOf(Math.max(...counts));
  return `いちばん多いのは「${MOOD_LABELS[maxIdx]}」`;
}

function trendLine(t: ReturnType<typeof moodTrend>): string {
  if (t.currentN === 0) return "今週の記録はまだありません";
  if (t.previousN === 0) return "先週の記録がたまると、比べられるようになります";
  if (t.diff < -0.15) return "先週より、すこし上向き";
  if (t.diff > 0.15) return "先週より、すこしお疲れぎみ";
  return "先週と同じくらいの調子";
}

/** 曜日ごとの平均気分から「軽やかな曜日」「丁寧にしたい曜日」を選ぶ */
function weekdayInsight(sums: number[], counts: number[]): string {
  let best = -1, worst = -1, recorded = 0;
  let bestAvg = Infinity, worstAvg = -Infinity;
  for (let w = 0; w < 7; w++) {
    if (counts[w] === 0) continue;
    recorded++;
    const avg = sums[w] / counts[w];
    if (avg < bestAvg) { bestAvg = avg; best = w; }
    if (avg > worstAvg) { worstAvg = avg; worst = w; }
  }
  if (best < 0) return "";
  // 全曜日が同じ平均（毎日同じ気分など）は「中心の曜日」ではない
  if (best === worst) {
    return recorded > 1 ? "どの曜日も、同じくらいの調子" : `${WEEKDAYS[best]}曜日の記録が中心`;
  }
  return `${WEEKDAYS[best]}曜日が軽やか。${WEEKDAYS[worst]}曜日は、少しゆっくりめに`;
}

export default function Lookback() {
  const router = useRouter();
  const entries = useJournal((s) => s.entries);
  const { isPremium } = useSubscription();
  const locked = isLocked("lookback", isPremium);
  const [range, setRange] = useState<30 | 90>(30);

  useEffect(() => {
    // 初回表示の計測のみ
    track("lookback_viewed", { premium: isPremium });
  }, []);

  // 無料: 直近7日
  const week = moodStats(entries, 7);
  const spark7 = moodSparkline(entries, 7);
  const trend = moodTrend(entries);

  // プレミアム: 30日・90日
  const stats = moodStats(entries, range);
  const weekday = moodByWeekday(entries, range);
  const longest = longestStreakInRange(entries, range);
  const wdLine = weekdayInsight(weekday.sums, weekday.counts);

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/journal");
            }}
            accessibilityRole="button"
            accessibilityLabel="戻る"
            hitSlop={12}
          >
            <Text style={s.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>気分の記録</Text>
            <Text style={s.title}>見返し</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* 直近7日（無料） */}
          <Text style={s.sectionTitle}>直近7日</Text>
          <View style={s.card}>
            {week.total === 0 ? (
              <Text style={s.empty}>まだ記録がありません。夜の振り返りから始めてみましょう。</Text>
            ) : (
              <>
                <View style={s.waveRow}>
                  {spark7.map((m, i) => (
                    <View key={`w-${i}`} style={s.waveCol}>
                      {m === null
                        ? <View style={s.waveGap} />
                        : <View style={[s.waveDot, { backgroundColor: MOOD_COLOR[m] }]} />}
                    </View>
                  ))}
                </View>
                <Text style={s.trendText}>{trendLine(trend)}</Text>
                <Text style={s.subNote}>7日のうち {week.total} 日記録。{topMoodLine(week.counts)}</Text>
              </>
            )}
          </View>

          {/* 30日・90日（プレミアム） */}
          <View style={s.rangeHeader}>
            <Text style={s.sectionTitle}>長い目で見る</Text>
            {!locked && (
              <View style={s.rangeChips}>
                {([30, 90] as const).map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => { haptics.select(); setRange(d); }}
                    style={[s.rangeChip, range === d && s.rangeChipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: range === d }}
                  >
                    <Text style={[s.rangeChipText, range === d && s.rangeChipTextOn]}>{d}日</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {locked ? (
            <PremiumLock
              title="30日・90日の見返し"
              description="気分の波・曜日のくせ・最長連続を、長い目でふり返れます"
              source="lookback"
            />
          ) : (
            <>
              <View style={s.statRow}>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{stats.total}</Text>
                  <Text style={s.statLabel}>記録した日</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={s.statNum}>{longest}</Text>
                  <Text style={s.statLabel}>最長連続</Text>
                </View>
              </View>

              <View style={s.card}>
                {stats.total === 0 ? (
                  <Text style={s.empty}>この期間の記録はまだありません。</Text>
                ) : (
                  <>
                    <Text style={s.cardTitle}>{range}日の気分</Text>
                    <View style={s.moodBars}>
                      {MOOD_LABELS.map((label, m) => {
                        const count = stats.counts[m];
                        const ratio = stats.total > 0 ? count / stats.total : 0;
                        return (
                          <View key={label} style={s.moodBarRow}>
                            <Text style={s.moodBarLabel}>{label}</Text>
                            <View style={s.moodBarTrack}>
                              <View style={[s.moodBarFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: MOOD_COLOR[m] }]} />
                            </View>
                            <Text style={s.moodBarCount}>{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                    {wdLine ? (
                      <View style={s.wdBox}>
                        <Text style={s.wdLabel}>曜日のくせ</Text>
                        <Text style={s.wdText}>{wdLine}</Text>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </>
          )}

          <Pressable style={s.cta} onPress={() => router.push("/journal")} accessibilityRole="button">
            <Text style={s.ctaText}>今日の振り返りを書く ›</Text>
          </Pressable>
        </ScrollView>
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

  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 12 },

  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 2, paddingHorizontal: 4, fontFamily: F.serif },
  rangeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  rangeChips: { flexDirection: "row", gap: 6 },
  rangeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,248,234,0.24)", borderWidth: 1, borderColor: "rgba(255,248,234,0.36)" },
  rangeChipOn: { backgroundColor: "#FFF8EA" },
  rangeChipText: { color: C.white, fontSize: 11, fontWeight: "800" },
  rangeChipTextOn: { color: C.ink },

  card: { backgroundColor: "#FFF8EA", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  cardTitle: { color: C.gold, fontSize: 11, fontWeight: "800", letterSpacing: 2, marginBottom: 12, fontFamily: F.serif },
  empty: { color: C.inkSub, fontSize: 12, lineHeight: 20, textAlign: "center", fontWeight: "600", fontFamily: F.serif },

  waveRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 28 },
  waveCol: { flex: 1, alignItems: "center" },
  waveDot: { width: 12, height: 12, borderRadius: 6 },
  waveGap: { width: 12, height: 2, borderRadius: 1, backgroundColor: "rgba(126,88,48,0.18)" },
  trendText: { color: C.ink, fontSize: 15, fontWeight: "800", marginTop: 14, textAlign: "center", fontFamily: F.serif },
  subNote: { color: C.inkSub, fontSize: 11, lineHeight: 18, marginTop: 6, fontWeight: "600", textAlign: "center" },

  statRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", backgroundColor: "#FFF8EA", borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  statNum: { color: C.red, fontSize: 26, fontWeight: "800", fontFamily: F.serif },
  statLabel: { color: "#9A6D2C", fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: 4 },

  moodBars: { gap: 8 },
  moodBarRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  moodBarLabel: { width: 64, color: "#574740", fontSize: 10, fontWeight: "700" },
  moodBarTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: "rgba(126,88,48,0.12)", overflow: "hidden" },
  moodBarFill: { height: 10, borderRadius: 5 },
  moodBarCount: { width: 24, textAlign: "right", color: C.inkSub, fontSize: 10, fontWeight: "700" },

  wdBox: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(126,88,48,0.14)" },
  wdLabel: { color: C.gold, fontSize: 10, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  wdText: { color: C.ink, fontSize: 13, lineHeight: 20, marginTop: 6, fontWeight: "700", fontFamily: F.serif },

  cta: { marginTop: 2, paddingVertical: 14, alignItems: "center", borderRadius: 24, backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  ctaText: { color: C.red, fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
});
