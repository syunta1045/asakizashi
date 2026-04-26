import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { useRelations, GENRE_INFO, compatibility, FREE_RELATION_LIMIT, type Genre } from "../../lib/relations";
import { useSubscription } from "../../lib/subscription";
import { dayPillar } from "../../lib/bazi";
import { rankingForDay } from "../../lib/ranking";
import { branchName } from "../../lib/ranking";
import { Coachmark } from "../../components/Coachmark";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Relations() {
  const router = useRouter();
  const { pillars } = useUser();
  const { list } = useRelations();
  const isPremium = useSubscription((s) => s.isPremium);
  const [filter, setFilter] = useState<Genre | "all">("all");
  const overLimit = !isPremium && list.length >= FREE_RELATION_LIMIT;
  const onAdd = () => {
    if (overLimit) {
      Alert.alert(
        "登録上限に達しました",
        `無料プランでは${FREE_RELATION_LIMIT}件まで登録できます。\nプレミアムにアップグレードすると無制限になります。`,
        [
          { text: "キャンセル", style: "cancel" },
          { text: "プレミアムを見る", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    router.push("/relations/add");
  };

  // === Hooks は条件分岐より上に配置（Hook順違反を回避） ===
  // pillars 未確定時は branch を空にして memo の依存を安定させる
  const myBranch = pillars?.day.branch ?? null;
  const todayBranch = dayPillar(new Date()).branch;
  const todayRanking = useMemo(() => rankingForDay(todayBranch), [todayBranch]);

  const filtered = useMemo(
    () => (filter === "all" ? list : list.filter((r) => r.genre === filter)),
    [list, filter]
  );
  const enriched = useMemo(
    () => myBranch
      ? filtered.map((r) => ({
          r,
          compat: compatibility(myBranch, r.pillars.day.branch),
          info: GENRE_INFO[r.genre],
          personRank: todayRanking.find((x) => x.branch === r.pillars.day.branch),
        }))
      : [],
    [filtered, myBranch, todayRanking]
  );

  // === ここから条件分岐 return（hooks の後） ===
  if (!pillars) return null;
  if (list.length === 0) {
    return <Empty onAdd={onAdd} />;
  }

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>YOUR CONNECTIONS</Text>
          <Text style={s.title}>つながり</Text>
        </View>

        {/* ジャンルフィルタ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <Pressable onPress={() => setFilter("all")} style={[s.filterChip, filter === "all" && s.filterChipOn]} accessibilityRole="button">
            <Text style={[s.filterText, filter === "all" && s.filterTextOn]}>すべて</Text>
          </Pressable>
          {(Object.entries(GENRE_INFO) as [Genre, typeof GENRE_INFO[Genre]][]).map(([key, g]) => (
            <Pressable key={key} onPress={() => setFilter(key)} style={[s.filterChip, filter === key && s.filterChipOn]} accessibilityRole="button">
              <Text style={[s.filterText, filter === key && s.filterTextOn]}>{g.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <Text style={s.filterEmpty}>このジャンルには登録がありません</Text>
          )}
          {enriched.map(({ r, compat, info, personRank }) => {
            return (
              <View key={r.id} style={s.card}>
                <View style={[s.icon, { backgroundColor: info.color }]}>
                  <Text style={s.iconText}>{info.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.name}>{r.name}</Text>
                    <View style={[s.tag, tagStyle(compat.kind)]}>
                      <Text style={s.tagText}>{tagLabel(compat.kind)}</Text>
                    </View>
                  </View>
                  <Text style={s.meta}>{info.label} ・ {r.label} ・ {r.pillars.day.stem}{r.pillars.day.branch}</Text>
                  {personRank && (
                    <View style={s.personRankRow}>
                      <Text style={s.personRankText}>
                        {branchName[r.pillars.day.branch]}年は今日 第{personRank.rank}位
                      </Text>
                    </View>
                  )}
                  <Text style={s.today}>{compat.reason}</Text>
                </View>
              </View>
            );
          })}

          <Pressable style={s.addBtn} onPress={onAdd} accessibilityRole="button">
            <Text style={s.addText}>＋ 新しいつながりを登録</Text>
          </Pressable>
          <Text style={s.limit}>無料は{FREE_RELATION_LIMIT}件まで・プレミアムは無制限</Text>
        </ScrollView>
      </SafeAreaView>
      <Coachmark
        k="relations_intro"
        title="つながりを登録すると"
        body="家族・恋人・推し・ペット・大切な日まで、生年月日があれば誰でも登録できます。毎朝、それぞれの今日の運気と相性が見られます。"
      />
    </LinearGradient>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>YOUR CONNECTIONS</Text>
          <Text style={s.title}>つながり</Text>
        </View>
        <ScrollView contentContainerStyle={s.list}>
          <Text style={s.emptyLede}>
            家族・恋人・推し・ペット・記念日まで{"\n"}生年月日があれば登録できます
          </Text>
          <View style={s.genreGrid}>
            {(Object.entries(GENRE_INFO) as [keyof typeof GENRE_INFO, typeof GENRE_INFO[keyof typeof GENRE_INFO]][]).map(([key, g]) => (
              <View key={key} style={s.genreCard}>
                <Text style={s.genreIcon}>{g.icon}</Text>
                <Text style={s.genreLabel}>{g.label}</Text>
                <Text style={s.genreSub}>{g.sub}</Text>
              </View>
            ))}
          </View>
          <Pressable style={s.cta} onPress={onAdd} accessibilityRole="button">
            <Text style={s.ctaText}>ジャンルを選んで登録</Text>
          </Pressable>
          <Text style={s.limit}>無料は{FREE_RELATION_LIMIT}件まで</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function tagStyle(k: ReturnType<typeof compatibility>["kind"]) {
  return { backgroundColor: k === "best" ? C.red : k === "good" ? C.gold : k === "warn" ? C.warn : "#888" };
}
function tagLabel(k: ReturnType<typeof compatibility>["kind"]) {
  return ({ best: "ベスト", good: "良好", warn: "注意", neutral: "穏やか" } as const)[k];
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  filterRow: { maxHeight: 44, marginBottom: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  filterChipOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  filterText: { color: C.white, fontSize: 11, fontFamily: F.serif },
  filterTextOn: { color: C.red, fontWeight: "600" },
  filterEmpty: { color: C.white, fontSize: 12, opacity: 0.7, textAlign: "center", padding: 24 },

  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: C.white95, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.paperBorder },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  iconText: { color: C.white, fontSize: 20, fontWeight: "500", fontFamily: F.serif },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: C.ink, fontSize: 14, fontWeight: "600", flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { color: C.white, fontSize: 9, fontWeight: "600", letterSpacing: 1 },
  meta: { color: C.gold, fontSize: 10, marginTop: 2, letterSpacing: 1 },
  personRankRow: { marginTop: 6 },
  personRankText: { color: C.red, fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  today: { color: C.inkSub, fontSize: 11, lineHeight: 18, marginTop: 6 },

  addBtn: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.5)", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12 },
  addText: { color: C.white, fontSize: 13 },
  limit: { color: C.white, fontSize: 10, opacity: 0.75, textAlign: "center", marginTop: 8 },

  emptyLede: { color: C.white, fontSize: 13, lineHeight: 24, textAlign: "center", marginVertical: 16, paddingHorizontal: 8, fontFamily: F.serif },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreCard: { width: "48.5%", backgroundColor: C.white12, borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: C.whiteBorder },
  genreIcon: { fontSize: 22, color: C.white, marginBottom: 8 },
  genreLabel: { color: C.white, fontSize: 12, fontWeight: "600" },
  genreSub: { color: C.white, fontSize: 9, opacity: 0.8, marginTop: 3 },
  cta: { marginTop: 20, padding: 14, alignItems: "center", backgroundColor: C.paper, borderRadius: 30, borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
