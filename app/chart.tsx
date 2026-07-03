import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../lib/store";
import { fiveElementBalance, yongShinOf, type Element, type ThreePillars } from "../lib/bazi";
import { C, dawnGradient, F } from "../lib/theme";

const ELEMENT_COLOR: Record<Element, string> = {
  木: "#5C8A6E", 火: "#C26E70", 土: "#A88340", 金: "#9B8FC4", 水: "#5B7BA8",
};

export default function Chart() {
  const router = useRouter();
  const u = useUser();
  const { pillars } = u;
  if (!pillars) {
    return (
      <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
        <SafeAreaView style={s.safe} edges={["top"]}>
          <View style={s.header}>
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/today")}
              hitSlop={16}
              accessibilityRole="button"
              accessibilityLabel="戻る"
            >
              <Text style={s.back}>‹</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.dateLabel}>あなたについて</Text>
              <Text style={s.title}>傾向メモ</Text>
            </View>
          </View>
          <View style={{ padding: 24, alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: C.white, fontSize: 16, lineHeight: 26, textAlign: "center", fontWeight: "600", marginBottom: 12 }}>
              生年月日を入力すると{"\n"}傾向メモが見られます
            </Text>
            <Text style={{ color: C.white, opacity: 0.85, fontSize: 12, lineHeight: 20, textAlign: "center", marginBottom: 24 }}>
              生年月日は任意です。{"\n"}未入力でも朝メモ・振り返り・つながりは使えます。
            </Text>
            <Pressable
              onPress={() => router.push("/edit/birth")}
              style={{ backgroundColor: C.paper, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: C.gold }}
              accessibilityRole="button"
            >
              <Text style={{ color: C.ink, fontSize: 13, fontWeight: "700", letterSpacing: 2 }}>生年月日を入力する</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const balance = fiveElementBalance(pillars);
  const max = Math.max(...Object.values(balance));
  const elements: Element[] = ["木", "火", "土", "金", "水"];
  const yongShin = yongShinOf(pillars);
  const summary = buildTendencySummary(pillars, balance);

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
            <Text style={s.dateLabel}>あなたについて</Text>
            <Text style={s.title}>傾向メモ</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>まずはここだけ</Text>
            <Text style={s.summaryTitle}>あなたの傾向まとめ</Text>
            <Text style={s.summaryText}>{summary.body}</Text>
            <View style={s.summaryGrid}>
              <View style={s.summaryCell}>
                <Text style={s.summaryCellLabel}>強み</Text>
                <Text style={s.summaryCellValue}>{summary.strongWord}</Text>
              </View>
              <View style={s.summaryCell}>
                <Text style={s.summaryCellLabel}>足すとよいこと</Text>
                <Text style={s.summaryCellValue}>{summary.softWord}</Text>
              </View>
            </View>
            <Text style={s.summaryNote}>下の詳しい情報は、気になるときだけ見れば大丈夫です。</Text>
          </View>

          <Section
            num="01"
            title="朝の整え方"
            desc="プロフィールから、朝に意識しやすい強みと、少し足すとよいことをメモにしています。"
          />
          <View style={s.pillarsCard}>
            <View style={s.tendencyRow}>
              <Text style={s.tendencyKey}>強み</Text>
              <Text style={s.tendencyValue}>{summary.strongWord}</Text>
            </View>
            <View style={s.tendencyRow}>
              <Text style={s.tendencyKey}>足すとよいこと</Text>
              <Text style={s.tendencyValue}>{summary.softWord}</Text>
            </View>
            <View style={[s.tendencyRow, s.tendencyRowLast]}>
              <Text style={s.tendencyKey}>今日の使い方</Text>
              <Text style={s.tendencyText}>朝は予定を広げすぎず、一つだけ選ぶと続けやすくなります。</Text>
            </View>
          </View>

          {/* 5つの傾向 */}
          <Section
            num="02"
            title="5つの傾向"
            desc="成長・表現・安定・決断・思考の5つを、暮らしの傾向として見たバランスです。多いテーマは強み、少ないテーマは少し足すと整いやすいポイントです。"
          />
          <View style={s.fiveCard}>
              <View style={s.bars}>
                {elements.map((e) => {
                  const v = balance[e];
                  const h = max > 0 ? (v / max) * 80 : 0;
                  return (
                    <View key={e} style={s.barCol}>
                      <Text style={s.barCount}>{v}</Text>
                      <View style={[s.bar, { height: h, backgroundColor: ELEMENT_COLOR[e] }]} />
                      <Text style={s.barLabel}>{ELEMENT_WORD[e]}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.fiveNote}>
                <Text style={s.fiveNoteHead}>{fiveSummary(balance)}</Text>
                <Text style={s.fiveNoteText}>{fiveDetail(balance)}</Text>
              </View>
              <View style={s.yongShinBox}>
                <Text style={s.yongShinLabel}>少し足すと整いやすいこと</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
                  <Text style={s.yongShinValue}>{ELEMENT_WORD[yongShin.yongShin]}</Text>
                  <Text style={s.kiShinText}>控えめにしたいこと: {ELEMENT_WORD[yongShin.kiShin]}</Text>
                </View>
                <Text style={s.yongShinDesc}>{balanceAction(yongShin.yongShin)}</Text>
              </View>
            </View>

          <Section
            num="03"
            title="長い目で見るテーマ"
            desc="今の時期に大切にしたいことを、暮らしのメモとして表示します。"
          />
          <View style={s.daiunCard}>
            <View style={s.daiunNowBox}>
              <Text style={s.daiunNowLabel}>今期のテーマ</Text>
              <Text style={s.daiunNowText}>{longRangeTheme(summary.strongWord, summary.softWord)}</Text>
            </View>
            <Text style={s.daiunNote}>
              ※ 朝の気づきを残すためのメモです。大事な判断は、自分のいまの気持ちに合わせて選んでください。
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function fiveSummary(b: Record<Element, number>): string {
  const sorted = (Object.entries(b) as [Element, number][]).sort((a, c) => c[1] - a[1]);
  return `${ELEMENT_WORD[sorted[0][0]]}が強く、${ELEMENT_WORD[sorted[sorted.length - 1][0]]}が少なめ。`;
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

const ELEMENT_WORD: Record<Element, string> = {
  木: "伸びやかさ",
  火: "表現する力",
  土: "落ち着き",
  金: "整理と決断",
  水: "考える力",
};

function balanceAction(element: Element) {
  return ({
    木: "新しい予定を増やすより、気になっていたことを一つだけ始めてみて。",
    火: "気持ちを言葉にする時間を少し作ると、自分の考えがまとまりやすくなります。",
    土: "予定の間に余白を置き、落ち着いて確認する時間を作ってみて。",
    金: "持ちものやタスクを一つ整理すると、次に選ぶことが見えやすくなります。",
    水: "調べる、読む、聞く時間を少し置くと、焦りがやわらぎます。",
  } as Record<Element, string>)[element];
}

function buildTendencySummary(pillars: ThreePillars, balance: Record<Element, number>) {
  const sorted = (Object.entries(balance) as [Element, number][]).sort((a, b) => b[1] - a[1]);
  const strong = sorted[0][0];
  const soft = sorted[sorted.length - 1][0];
  return {
    strongWord: ELEMENT_WORD[strong],
    softWord: ELEMENT_WORD[soft],
    body: `朝しるべでは、プロフィールから日々の整え方をメモにします。${ELEMENT_WORD[strong]}が強みに出やすく、${ELEMENT_WORD[soft]}を少し足すと、毎日の選び方が整いやすくなります。`,
  };
}

function longRangeTheme(strongWord: string, softWord: string) {
  return `${strongWord}を活かしながら、${softWord}を少しずつ足していく時期です。大きく変えようとするより、朝のひとつ・夜のひとことを続けるほど、自分の調子が見えやすくなります。`;
}

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

  summaryCard: { backgroundColor: C.paper, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.paperBorder, shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  summaryLabel: { color: C.gold, fontSize: 10, letterSpacing: 2, fontWeight: "800" },
  summaryTitle: { color: C.ink, fontSize: 20, fontWeight: "800", marginTop: 6, fontFamily: F.serif },
  summaryText: { color: C.inkSub, fontSize: 12, lineHeight: 22, marginTop: 10, fontWeight: "600" },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  summaryCell: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "rgba(168,131,64,0.1)", borderWidth: 1, borderColor: "rgba(168,131,64,0.18)" },
  summaryCellLabel: { color: C.gold, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  summaryCellValue: { color: C.red, fontSize: 13, fontWeight: "800", marginTop: 5 },
  summaryNote: { color: C.inkMuted, fontSize: 10, lineHeight: 17, marginTop: 12, fontWeight: "600" },

  pillarsCard: { backgroundColor: C.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.paperBorder },
  tendencyRow: { paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  tendencyRowLast: { borderBottomWidth: 0 },
  tendencyKey: { color: C.gold, fontSize: 10, letterSpacing: 2, fontWeight: "800", fontFamily: F.serif },
  tendencyValue: { color: C.red, fontSize: 18, lineHeight: 26, marginTop: 5, fontWeight: "800", fontFamily: F.serif },
  tendencyText: { color: C.ink, fontSize: 13, lineHeight: 22, marginTop: 5, fontWeight: "700", fontFamily: F.serif },
  pillarsRow: { flexDirection: "row", gap: 8 },
  pillar: { flex: 1, alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: C.paperBorder },
  pillarHi: { borderWidth: 2, borderColor: C.red, backgroundColor: C.white },
  pillarLabel: { color: C.gold, fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  pillarLabelHi: { color: C.red },
  pillarStem: { color: C.ink, fontSize: 22, fontWeight: "500", marginTop: 4, fontFamily: F.serif },

  dayMeaningCard: { marginTop: 12, padding: 18, backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder },
  dayMeaningLabel: { color: C.gold, fontSize: 10, letterSpacing: 3, fontWeight: "600" },
  dayMeaningHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  dayMeaningKanji: { color: C.red, fontSize: 32, fontFamily: F.serif, fontWeight: "600", letterSpacing: 4, lineHeight: 38 },
  dayMeaningRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.paperBorder },
  dayMeaningKanjiSmall: { color: C.red, fontSize: 20, fontFamily: F.serif, fontWeight: "500", width: 24, textAlign: "center", lineHeight: 24 },
  dayMeaningText: { flex: 1, color: C.ink, fontSize: 12, lineHeight: 20, fontFamily: F.serif },

  tenGodsCard: { backgroundColor: C.white95, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.paperBorder },
  tenGodRow: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: C.paperBorder, gap: 12 },
  tenGodPillar: { color: C.gold, fontSize: 10, letterSpacing: 1, width: 56, fontWeight: "600" },
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
