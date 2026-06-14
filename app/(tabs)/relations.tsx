import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { useRelations, ACTIVE_GENRES, GENRE_INFO, compatibility, FREE_RELATION_LIMIT, type Genre } from "../../lib/relations";
import { useSubscription } from "../../lib/subscription";
import { C, morningGradient, F } from "../../lib/theme";

const BASIS_NOTE = "相手の気持ちを決めつけるものではありません。自分の言葉選びと距離感を整えるためのメモです。";

export default function Relations() {
  const router = useRouter();
  const { pillars } = useUser();
  const { list, remove } = useRelations();
  const isPremium = useSubscription((s) => s.isPremium);
  const [filter, setFilter] = useState<Genre | "all">("all");
  const overLimit = !isPremium && list.length >= FREE_RELATION_LIMIT;
  const onAdd = () => {
    if (overLimit) {
      Alert.alert(
        "登録上限に達しました",
        `通常プランでは${FREE_RELATION_LIMIT}件まで登録できます。\nプレミアムをはじめると無制限になります。`,
        [
          { text: "キャンセル", style: "cancel" },
          { text: "プレミアムを見る", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    router.push("/relations/add");
  };
  const onRemove = (id: string, name: string) => {
    Alert.alert(
      "登録を削除しますか",
      `${name} を一覧から削除します。`,
      [
        { text: "キャンセル", style: "cancel" },
        { text: "削除", style: "destructive", onPress: () => remove(id) },
      ]
    );
  };

  // === Hooks は条件分岐より上に配置（Hook順違反を回避） ===
  // pillars 未確定時は branch を空にして memo の依存を安定させる
  const myBranch = pillars?.year.branch ?? null;
  const filtered = useMemo(
    () => (filter === "all" ? list : list.filter((r) => r.genre === filter)),
    [list, filter]
  );
  const enriched = useMemo(
    () => filtered.map((r) => ({
      r,
      compat: myBranch ? compatibility(myBranch, r.pillars.year.branch) : null,
      info: GENRE_INFO[r.genre],
    })),
    [filtered, myBranch]
  );

  // === ここから条件分岐 return（hooks の後） ===
  // 生年月日未入力時も relations 自体は表示できる（距離感タグだけ非表示）
  if (list.length === 0) {
    return <Empty onAdd={onAdd} />;
  }

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>大切な人メモ</Text>
          <Text style={s.title}>つながり</Text>
        </View>

        {/* ジャンルフィルタ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          <Pressable onPress={() => setFilter("all")} style={[s.filterChip, filter === "all" && s.filterChipOn]} accessibilityRole="button">
            <Text style={[s.filterText, filter === "all" && s.filterTextOn]}>すべて</Text>
          </Pressable>
          {ACTIVE_GENRES.map((key) => {
            const g = GENRE_INFO[key];
            return (
            <Pressable key={key} onPress={() => setFilter(key)} style={[s.filterChip, filter === key && s.filterChipOn]} accessibilityRole="button">
              <Text style={[s.filterText, filter === key && s.filterTextOn]}>{g.label}</Text>
            </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <View style={s.basisNote}>
            <Text style={s.basisNoteText}>{BASIS_NOTE}</Text>
          </View>
          {filtered.length === 0 && (
            <Text style={s.filterEmpty}>このジャンルには登録がありません</Text>
          )}
          {enriched.map(({ r, compat, info }) => {
            return (
              <View key={r.id} style={s.card}>
                <View style={[s.icon, { backgroundColor: info.color }]}>
                  <Text style={s.iconText}>{info.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.nameRow}>
                    <Text style={s.name}>{r.name}</Text>
                    {compat && (
                      <View
                        style={[s.tag, tagStyle(compat.kind)]}
                        accessibilityLabel={`距離感: ${tagLabel(compat.kind)}`}
                      >
                        <Text style={s.tagText}>{tagLabel(compat.kind)}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.meta}>{relationMeta(info.label, r.label)}</Text>
                  {compat && <Text style={s.today}>{compat.reason}</Text>}
                  <Pressable
                    onPress={() => onRemove(r.id, r.name)}
                    style={s.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.name}を削除`}
                  >
                    <Text style={s.removeText}>削除</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable style={s.addBtn} onPress={onAdd} accessibilityRole="button">
            <Text style={s.addText}>＋ 新しく登録</Text>
          </Pressable>
          <Text style={s.limit}>通常は{FREE_RELATION_LIMIT}件まで・プレミアムは無制限</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>大切な人メモ</Text>
          <Text style={s.title}>つながり</Text>
        </View>
        <ScrollView contentContainerStyle={s.list}>
          <Text style={s.emptyLede}>大切な人、推し、ペット、記念日を登録できます</Text>
          <View style={s.basisNote}>
            <Text style={s.basisNoteText}>{BASIS_NOTE}</Text>
          </View>
          <View style={s.genreGrid}>
            {ACTIVE_GENRES.map((key) => {
              const g = GENRE_INFO[key];
              return (
              <View key={key} style={s.genreCard}>
                <Text style={s.genreIcon}>{g.icon}</Text>
                <Text style={s.genreLabel}>{g.label}</Text>
                <Text style={s.genreSub}>{g.sub}</Text>
              </View>
              );
            })}
          </View>
          <Pressable style={s.cta} onPress={onAdd} accessibilityRole="button">
            <Text style={s.ctaText}>新しく登録する</Text>
          </Pressable>
          <Text style={s.limit}>通常は{FREE_RELATION_LIMIT}件まで</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function tagStyle(k: ReturnType<typeof compatibility>["kind"]) {
  return { backgroundColor: k === "best" ? C.red : k === "good" ? C.gold : k === "warn" ? C.warn : "#888" };
}
function tagLabel(k: ReturnType<typeof compatibility>["kind"]) {
  return ({ best: "近い", good: "良い", warn: "控えめ", neutral: "穏やか" } as const)[k];
}
function relationMeta(genreLabel: string, relationLabel: string) {
  return genreLabel === relationLabel ? genreLabel : `${genreLabel} ・ ${relationLabel}`;
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  dateLabel: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 3, fontWeight: "700" },
  title: { color: C.white, fontSize: 24, fontWeight: "800", letterSpacing: 2, marginTop: 4, fontFamily: F.serif },
  list: { paddingHorizontal: 18, paddingBottom: 46, gap: 10 },
  filterRow: { maxHeight: 44, marginBottom: 6 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, backgroundColor: "rgba(255,248,234,0.24)", borderWidth: 1, borderColor: "rgba(255,248,234,0.36)" },
  filterChipOn: { backgroundColor: "#FFF8EA", borderColor: "rgba(126,88,48,0.18)" },
  filterText: { color: C.white, fontSize: 11, fontFamily: F.serif, fontWeight: "700" },
  filterTextOn: { color: C.red, fontWeight: "800" },
  filterEmpty: { color: C.white, fontSize: 12, opacity: 0.7, textAlign: "center", padding: 24 },
  basisNote: { paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, backgroundColor: "rgba(255,248,234,0.24)", borderWidth: 1, borderColor: "rgba(255,248,234,0.34)", marginBottom: 2 },
  basisNoteText: { color: "#FFF8EA", fontSize: 11, lineHeight: 18, fontWeight: "700", fontFamily: F.serif },

  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FFF8EA", borderRadius: 14, padding: 15, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  iconText: { color: C.white, fontSize: 20, fontWeight: "500", fontFamily: F.serif },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { color: C.ink, fontSize: 15, fontWeight: "800", flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { color: C.white, fontSize: 9, fontWeight: "600", letterSpacing: 1 },
  meta: { color: C.gold, fontSize: 10, marginTop: 2, letterSpacing: 1 },
  today: { color: "#574740", fontSize: 12, lineHeight: 20, marginTop: 6, fontWeight: "600" },
  removeBtn: { alignSelf: "flex-start", marginTop: 8, paddingVertical: 4, paddingRight: 12 },
  removeText: { color: C.red, fontSize: 10, fontWeight: "600", letterSpacing: 1 },

  addBtn: { borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,248,234,0.62)", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 12, backgroundColor: "rgba(255,248,234,0.16)" },
  addText: { color: C.white, fontSize: 13, fontWeight: "800" },
  limit: { color: "#FFF8EA", fontSize: 10, opacity: 0.85, textAlign: "center", marginTop: 8, fontWeight: "700" },

  emptyLede: { color: C.white, fontSize: 13, lineHeight: 24, textAlign: "center", marginVertical: 16, paddingHorizontal: 8, fontFamily: F.serif },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreCard: { width: "48.5%", minHeight: 78, backgroundColor: C.white12, borderRadius: 14, padding: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.whiteBorder },
  genreIcon: { fontSize: 20, color: C.white, marginBottom: 6 },
  genreLabel: { color: C.white, fontSize: 12, fontWeight: "600" },
  genreSub: { color: C.white, fontSize: 9, opacity: 0.8, marginTop: 3, textAlign: "center", lineHeight: 13 },
  cta: { marginTop: 14, padding: 14, alignItems: "center", backgroundColor: C.paper, borderRadius: 30, borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 13, fontWeight: "600", letterSpacing: 2, fontFamily: F.serif },
});
