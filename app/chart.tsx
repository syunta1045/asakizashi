import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../lib/store";
import { useSubscription, isLocked } from "../lib/subscription";
import { stemReading, branchReading, stemMeaning, branchMeaning, stemElement, branchElement, fiveElementBalance, tenGodsAcross, tenGodDescription, daiunPillars, calcAge, yongShinOf, type Element } from "../lib/bazi";
import { PremiumLock } from "../components/PremiumLock";
import { C, dawnGradient, F } from "../lib/theme";

const ELEMENT_COLOR: Record<Element, string> = {
  木: "#5C8A6E", 火: "#C26E70", 土: "#A88340", 金: "#9B8FC4", 水: "#5B7BA8",
};

export default function Chart() {
  const router = useRouter();
  const u = useUser();
  const { pillars, gender, birthYear, birthMonth, birthDay } = u;
  const { isPremium } = useSubscription();
  if (!pillars) return null;

  const balance = fiveElementBalance(pillars);
  const max = Math.max(...Object.values(balance));
  const elements: Element[] = ["木", "火", "土", "金", "水"];
  const fiveLocked = isLocked("fiveElements", isPremium);
  const yongShin = yongShinOf(pillars);

  const age = calcAge(birthYear, birthMonth, birthDay);
  const daiun = daiunPillars(pillars, gender || "none", 8);
  const currentDaiunIdx = daiun.findIndex((d) => age >= d.startAge && age <= d.endAge);

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/today");
            }}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <Text style={s.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>YOUR CHART</Text>
            <Text style={s.title}>命式の詳細</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* 三柱表 */}
          <Section
            num="01"
            title="あなたの三柱"
            desc="生まれた年・月・日それぞれの干支。年柱は祖先や幼少期、月柱は社会での立場、日柱があなた自身を表します。"
          />
          <View style={s.pillarsCard}>
            <View style={s.pillarsRow}>
              {[
                { l: "年柱", p: pillars.year },
                { l: "月柱", p: pillars.month },
                { l: "日柱", p: pillars.day, hi: true },
              ].map((x) => (
                <View key={x.l} style={[s.pillar, x.hi && s.pillarHi]}>
                  <Text style={[s.pillarLabel, x.hi && s.pillarLabelHi]}>{x.l}</Text>
                  <Text style={s.pillarStem}>{x.p.stem}</Text>
                  <Text style={s.pillarStem}>{x.p.branch}</Text>
                  <Text style={s.pillarReading}>{stemReading[x.p.stem]}・{branchReading[x.p.branch]}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={s.dayMeaningCard}>
            <Text style={s.dayMeaningLabel}>日柱 ＝ あなた自身</Text>
            <View style={s.dayMeaningHeader}>
              <Text style={s.dayMeaningKanji}>{pillars.day.stem}{pillars.day.branch}</Text>
              <Text style={s.dayMeaningReading}>
                {stemReading[pillars.day.stem]}（{stemElement[pillars.day.stem]}）{"\n"}
                {branchReading[pillars.day.branch]}（{branchElement[pillars.day.branch]}）
              </Text>
            </View>
            <View style={s.dayMeaningRow}>
              <Text style={s.dayMeaningKanjiSmall}>{pillars.day.stem}</Text>
              <Text style={s.dayMeaningText}>{stemMeaning[pillars.day.stem]}</Text>
            </View>
            <View style={s.dayMeaningRow}>
              <Text style={s.dayMeaningKanjiSmall}>{pillars.day.branch}</Text>
              <Text style={s.dayMeaningText}>{branchMeaning[pillars.day.branch]}</Text>
            </View>
          </View>

          {/* 十神 */}
          <Section
            num="02"
            title="十神（じっしん）"
            desc="日柱の干（あなた自身）から見た、他の干との関係。性格・才能・人との縁の出方を読み解きます。"
          />
          <View style={s.tenGodsCard}>
            {tenGodsAcross(pillars).map((g) => (
              <View key={g.pillar} style={s.tenGodRow}>
                <Text style={s.tenGodPillar}>{g.pillar}</Text>
                <Text style={s.tenGodStem}>{g.stem}</Text>
                <Text style={s.tenGodName}>{g.god}</Text>
                <Text style={s.tenGodDesc}>{g.god !== "—" ? tenGodDescription[g.god] : "あなた自身"}</Text>
              </View>
            ))}
          </View>

          {/* 五行バランス */}
          <Section
            num="03"
            title="五行のバランス"
            desc="木・火・土・金・水の五つの気の配分。多い気は強み、少ない気は補うべき要素として日々の指針になります。"
          />
          {fiveLocked ? (
            <PremiumLock
              title="五行バランスはプレミアム限定"
              description="木火土金水のバランスから、あなたの命式の傾向を読み解きます"
            />
          ) : (
            <View style={s.fiveCard}>
              <View style={s.bars}>
                {elements.map((e) => {
                  const v = balance[e];
                  const h = max > 0 ? (v / max) * 80 : 0;
                  return (
                    <View key={e} style={s.barCol}>
                      <Text style={s.barCount}>{v}</Text>
                      <View style={[s.bar, { height: h, backgroundColor: ELEMENT_COLOR[e] }]} />
                      <Text style={s.barLabel}>{e}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.fiveNote}>
                <Text style={s.fiveNoteHead}>{fiveSummary(balance)}</Text>
                <Text style={s.fiveNoteText}>{fiveDetail(balance)}</Text>
              </View>
              <View style={s.yongShinBox}>
                <Text style={s.yongShinLabel}>用神（補うべき気）</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
                  <Text style={s.yongShinValue}>{yongShin.yongShin}</Text>
                  <Text style={s.kiShinText}>忌神（控えめに）: {yongShin.kiShin}</Text>
                </View>
                <Text style={s.yongShinDesc}>{yongShin.description}</Text>
              </View>
            </View>
          )}

          {/* 大運 */}
          <Section
            num="04"
            title="大運（10年運）"
            desc="人生を10年ごとに区切った大きな運の流れ。今いる柱の干支があなたの今期のテーマです。"
          />
          <View style={s.daiunCard}>
            {daiun.map((d, i) => (
              <View key={i} style={[s.daiunRow, i === currentDaiunIdx && s.daiunRowCurrent]}>
                <Text style={[s.daiunAge, i === currentDaiunIdx && s.daiunAgeCurrent]}>
                  {d.startAge}-{d.endAge}歳
                </Text>
                <Text style={[s.daiunPillar, i === currentDaiunIdx && s.daiunPillarCurrent]}>
                  {d.pillar.stem}{d.pillar.branch}
                </Text>
                {i === currentDaiunIdx && (
                  <Text style={s.daiunCurrent}>← 今</Text>
                )}
              </View>
            ))}
            {currentDaiunIdx >= 0 && daiun[currentDaiunIdx] && (
              <View style={s.daiunNowBox}>
                <Text style={s.daiunNowLabel}>今期のテーマ</Text>
                <Text style={s.daiunNowText}>
                  {stemMeaning[daiun[currentDaiunIdx].pillar.stem]}{"\n"}
                  {branchMeaning[daiun[currentDaiunIdx].pillar.branch]}
                </Text>
              </View>
            )}
            <Text style={s.daiunNote}>
              ※ 起算年齢は概算 8歳。本来は出生時刻から精密に算出します。
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function fiveSummary(b: Record<Element, number>): string {
  const sorted = (Object.entries(b) as [Element, number][]).sort((a, c) => c[1] - a[1]);
  return `${sorted[0][0]}の気が強く、${sorted[sorted.length - 1][0]}が少なめ。`;
}
function fiveDetail(b: Record<Element, number>): string {
  const sorted = (Object.entries(b) as [Element, number][]).sort((a, c) => c[1] - a[1]);
  return HINT[sorted[0][0]];
}

const HINT: Record<Element, string> = {
  木: "成長・伸びやかさが原動力。先を急ぎすぎないように。",
  火: "情熱と表現が強み。落ち着く時間も意識して。",
  土: "落ち着き・安定感がある。決断力と柔軟性を補うと整う。",
  金: "けじめと潔さが魅力。やわらかさを忘れずに。",
  水: "知性と柔軟さに長ける。芯を持つことを意識して。",
};

function Section({ num, title, desc }: { num: string; title: string; desc?: string }) {
  return (
    <View>
      <View style={s.section}>
        <Text style={s.sectionNum}>{num}</Text>
        <View style={s.sectionLine} />
        <Text style={s.sectionTitle}>{title}</Text>
        <View style={s.sectionLine} />
      </View>
      {desc && <Text style={s.sectionDesc}>{desc}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  back: { color: C.white, fontSize: 22 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 16, paddingBottom: 60 },

  section: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 12 },
  sectionNum: { color: C.gold, fontSize: 11, fontWeight: "600", letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  sectionTitle: { color: C.white, fontSize: 13, fontWeight: "500", letterSpacing: 3, fontFamily: F.serif },
  sectionDesc: { color: C.white, opacity: 0.78, fontSize: 11, lineHeight: 18, marginTop: -4, marginBottom: 12, paddingHorizontal: 4, fontFamily: F.serif },

  pillarsCard: { backgroundColor: C.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.paperBorder },
  pillarsRow: { flexDirection: "row", gap: 8 },
  pillar: { flex: 1, alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: C.paperBorder },
  pillarHi: { borderWidth: 2, borderColor: C.red, backgroundColor: C.white },
  pillarLabel: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  pillarLabelHi: { color: C.red },
  pillarStem: { color: C.ink, fontSize: 22, fontWeight: "500", marginTop: 4, fontFamily: F.serif },
  pillarReading: { color: C.inkSub, fontSize: 8, marginTop: 6, textAlign: "center", lineHeight: 12, fontFamily: F.serif },

  dayMeaningCard: { marginTop: 12, padding: 18, backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder },
  dayMeaningLabel: { color: C.gold, fontSize: 10, letterSpacing: 3, fontWeight: "600" },
  dayMeaningHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  dayMeaningKanji: { color: C.red, fontSize: 32, fontFamily: F.serif, fontWeight: "600", letterSpacing: 4, lineHeight: 38 },
  dayMeaningReading: { color: C.inkSub, fontSize: 11, lineHeight: 18, fontFamily: F.serif },
  dayMeaningRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.paperBorder },
  dayMeaningKanjiSmall: { color: C.red, fontSize: 20, fontFamily: F.serif, fontWeight: "500", width: 24, textAlign: "center", lineHeight: 24 },
  dayMeaningText: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 20, fontFamily: F.serif },

  tenGodsCard: { backgroundColor: C.white95, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.paperBorder },
  tenGodRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: C.paperBorder, gap: 12 },
  tenGodPillar: { color: C.gold, fontSize: 10, letterSpacing: 2, width: 36, fontWeight: "600" },
  tenGodStem: { color: C.ink, fontSize: 18, fontFamily: F.serif, width: 24, textAlign: "center", fontWeight: "500" },
  tenGodName: { color: C.red, fontSize: 13, fontWeight: "600", width: 48, fontFamily: F.serif },
  tenGodDesc: { color: C.inkSub, fontSize: 11, flex: 1, fontFamily: F.serif },
  fiveCard: { backgroundColor: C.white95, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.paperBorder },
  daiunCard: { backgroundColor: C.white95, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.paperBorder },
  daiunRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.paperBorder, gap: 12 },
  daiunRowCurrent: { backgroundColor: "rgba(158,47,47,0.06)" },
  daiunAge: { color: C.gold, fontSize: 11, fontWeight: "600", letterSpacing: 1, width: 76 },
  daiunAgeCurrent: { color: C.red },
  daiunPillar: { color: C.ink, fontSize: 18, fontWeight: "500", letterSpacing: 2, fontFamily: F.serif },
  daiunPillarCurrent: { color: C.red, fontWeight: "600" },
  daiunCurrent: { color: C.red, fontSize: 11, fontWeight: "600", marginLeft: "auto" },
  daiunNote: { color: C.inkSub, fontSize: 9, padding: 12, lineHeight: 14, fontFamily: F.serif },
  daiunNowBox: { padding: 14, marginHorizontal: 8, marginTop: 12, marginBottom: 4, borderRadius: 10, backgroundColor: "rgba(168,30,30,0.08)", borderWidth: 1, borderColor: "rgba(168,30,30,0.18)" },
  daiunNowLabel: { color: C.red, fontSize: 10, letterSpacing: 3, fontWeight: "600", fontFamily: F.serif },
  daiunNowText: { color: C.ink, fontSize: 12, lineHeight: 20, marginTop: 6, fontFamily: F.serif },
  bars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 110, gap: 8 },
  barCol: { flex: 1, alignItems: "center" },
  barCount: { color: C.inkSub, fontSize: 9, marginBottom: 4 },
  bar: { width: "100%", borderTopLeftRadius: 4, borderTopRightRadius: 4, minHeight: 4 },
  barLabel: { color: C.ink, fontSize: 13, fontWeight: "500", marginTop: 6, fontFamily: F.serif },
  fiveNote: { marginTop: 14, padding: 12, backgroundColor: "rgba(184,150,86,0.1)", borderRadius: 10 },
  fiveNoteHead: { color: C.ink, fontSize: 12, fontWeight: "600", lineHeight: 20, fontFamily: F.serif, marginBottom: 6 },
  fiveNoteText: { color: C.inkSub, fontSize: 11, lineHeight: 18, fontFamily: F.serif },
  yongShinBox: { marginTop: 12, padding: 14, borderTopWidth: 1, borderTopColor: C.paperBorder },
  yongShinLabel: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  yongShinValue: { color: C.red, fontSize: 32, fontWeight: "600", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  kiShinText: { color: C.inkSub, fontSize: 11, fontFamily: F.serif },
  yongShinDesc: { color: C.inkSub, fontSize: 11, marginTop: 8, lineHeight: 18, fontFamily: F.serif },
});
