import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../../lib/store";
import { haptics } from "../../lib/haptics";
import { C, dawnGradient, F } from "../../lib/theme";

export default function ConfirmStep() {
  const router = useRouter();
  const u = useUser();

  const onConfirm = () => {
    if (!u.nickname.trim()) {
      router.push("/(onboarding)/name");
      return;
    }
    if (u.themes.length === 0) {
      router.push("/(onboarding)/themes");
      return;
    }
    haptics.medium();
    u.computePillars(); // birthDateProvided=false なら内部で no-op
    router.push("/reveal");
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top","bottom"]}>
        {/* Progress 7/7 */}
        <View style={s.progressRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button">
            <Text style={s.back}>‹</Text>
          </Pressable>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[s.bar, s.barOn]} />
          ))}
          <Text style={s.stepText}>確認</Text>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>これで始めますか？</Text>
          <Text style={s.sub}>あとから設定で変更できます</Text>

          <View style={s.card}>
            <Row k="ニックネーム" v={u.nickname || "—"} />
            <Row k="起床時間" v={`${u.wakeUpTime}（通知 ${notifyTimeFrom(u.wakeUpTime)}）`} />
            <View style={s.themesRow}>
              <Text style={s.rowKey}>関心テーマ</Text>
              <View style={s.themesValRow}>
                {u.themes.length === 0 && <Text style={s.rowVal}>—</Text>}
                {u.themes.map((t) => (
                  <View key={t} style={s.themeChip}>
                    <Text style={s.themeChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <Pressable style={s.cta} onPress={onConfirm} accessibilityRole="button">
          <Text style={s.ctaText}>朝メモへ</Text>
        </Pressable>
        <Pressable style={s.editBtn} onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.editText}>修正する</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{k}</Text>
      <Text style={s.rowVal}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28, maxWidth: 480, width: "100%", alignSelf: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 4 },
  back: { color: C.white, fontSize: 26, paddingRight: 8, fontWeight: "300" },
  bar: { flex: 1, height: 3, borderRadius: 2, marginRight: 6 },
  barOn: { backgroundColor: "rgba(255,255,255,0.95)" },
  stepText: { color: C.white, fontSize: 10, opacity: 0.85, marginLeft: 4, fontFamily: F.serif },

  body: { paddingBottom: 24 },
  title: { color: C.white, fontSize: 22, lineHeight: 36, fontWeight: "500", fontFamily: F.serif },
  sub: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 12, lineHeight: 22, fontFamily: F.serif },

  card: { marginTop: 22, backgroundColor: C.paper, borderRadius: 14, paddingVertical: 4, borderWidth: 1, borderColor: C.paperBorder },
  row: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  rowKey: { color: C.gold, fontSize: 12, fontWeight: "600", fontFamily: F.serif },
  rowVal: { color: C.ink, fontSize: 13, fontFamily: F.serif, textAlign: "right", flex: 1, paddingLeft: 12 },

  themesRow: { padding: 16 },
  themesValRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  themeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(184,150,86,0.15)", borderWidth: 1, borderColor: C.paperBorder },
  themeChipText: { color: C.ink, fontSize: 11, fontFamily: F.serif },

  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold, marginBottom: 8 },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 3, fontFamily: F.serif },
  editBtn: { paddingVertical: 8, alignItems: "center" },
  editText: { color: C.white, fontSize: 12, opacity: 0.85, fontFamily: F.serif },
});
