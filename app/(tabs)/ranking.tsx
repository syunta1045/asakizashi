import { View, Text, ScrollView, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../lib/store";
import { dayPillar } from "../../lib/bazi";
import { rankingForDay, branchName, rankComment } from "../../lib/ranking";
import { Coachmark } from "../../components/Coachmark";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Ranking() {
  const { pillars } = useUser();
  if (!pillars) return null;

  const today = dayPillar(new Date());
  const ranking = rankingForDay(today.branch);
  const my = pillars.day.branch;

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>{today.stem}{today.branch}日</Text>
          <Text style={s.title}>十二支 運勢順位</Text>
        </View>

        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {ranking.map((r) => {
            const isMy = r.branch === my;
            const isTop = r.rank <= 3;
            return (
              <View
                key={r.branch}
                style={[s.row, isMy && s.rowMy]}
                accessibilityLabel={`${r.rank}位 ${branchName[r.branch]}年 相性スコア${r.score}${isMy ? "（あなた）" : ""}`}
              >
                <Text style={[
                  s.rank,
                  isMy && s.rankMy,
                  isTop && !isMy && s.rankTop,
                ]}>{r.rank}</Text>

                <View style={[s.eto, isMy && s.etoMy]}>
                  <Text style={[s.etoText, isMy && s.etoTextMy]}>{r.branch}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={[s.name, isMy && s.nameMy]}>{branchName[r.branch]}年</Text>
                    {isMy && <Text style={s.youTag}>──── あなた</Text>}
                  </View>
                  {isMy && <Text style={s.comment}>{rankComment(r.rank)}</Text>}
                  <View style={[s.scoreBar, isMy && s.scoreBarMy]}>
                    <View style={[
                      s.scoreFill,
                      { width: `${r.score}%` },
                      isMy && s.scoreFillMy,
                    ]} />
                  </View>
                </View>

                <Text style={[s.score, isMy && s.scoreMy]}>{r.score}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
      <Coachmark
        k="ranking_intro"
        title="十二支ランキング"
        body="今日の干支との相性から、十二支それぞれの今日の運気を順位で表示します。あなたの位置がハイライトされます。"
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3, fontFamily: F.serif },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 6 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 12,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  rowMy: { backgroundColor: C.paper, borderColor: C.paperBorder },
  rank: { color: "rgba(255,255,255,0.7)", fontSize: 22, fontWeight: "300", minWidth: 36, textAlign: "center", fontFamily: F.serif },
  rankMy: { color: C.red, fontSize: 30, fontWeight: "500" },
  rankTop: { color: C.white, fontSize: 30 },
  eto: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  etoMy: { backgroundColor: "rgba(168,131,64,0.15)" },
  etoText: { color: C.white, fontSize: 20, fontWeight: "500", fontFamily: F.serif },
  etoTextMy: { color: C.red },
  nameRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  name: { color: C.white, fontSize: 12, fontWeight: "600" },
  nameMy: { color: C.ink },
  youTag: { color: C.red, fontSize: 9, letterSpacing: 2 },
  comment: { color: C.inkSub, fontSize: 11, marginTop: 4, lineHeight: 16, fontFamily: F.serif },
  scoreBar: { marginTop: 6, height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" },
  scoreBarMy: { backgroundColor: "rgba(168,131,64,0.2)" },
  scoreFill: { height: "100%", backgroundColor: "rgba(255,255,255,0.7)" },
  scoreFillMy: { backgroundColor: C.red },
  score: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "500", minWidth: 30, textAlign: "right" },
  scoreMy: { color: C.red },
});
