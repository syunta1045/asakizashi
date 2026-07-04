import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../../lib/store";
import { C, morningGradient, F } from "../../lib/theme";

export default function Profile() {
  const router = useRouter();
  const u = useUser();
  // 生年月日が未入力でもプロフィール画面は表示できる
  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.heading}>プロフィール</Text>
          <Text style={s.title}>あなたのこと</Text>

          <View style={s.card}>
            <Text style={s.sectionLabel}>◆ 朝のパーソナル設定</Text>
            <Text style={s.profileLead}>朝メモ・通知・振り返りを、あなたの生活リズムに合わせます。</Text>

            <View style={s.divider} />
            <Row k="ニックネーム" v={u.nickname || "未設定"} onPress={() => router.push("/edit/nickname")} />
            <Row k="生年月日" v={u.birthDateProvided ? `${u.birthYear}年${u.birthMonth}月${u.birthDay}日` : "未入力（任意）"} onPress={() => router.push("/edit/birth")} />
            <Row k="生まれた場所" v={u.birthDateProvided && u.birthPlace ? u.birthPlace : "—"} onPress={() => router.push("/edit/place")} />
            <Row k="MBTI" v={u.mbti || "未設定"} onPress={() => router.push("/edit/mbti")} />
            <Row k="血液型" v={u.bloodType ? (u.bloodType === "unknown" ? "わからない" : `${u.bloodType}型`) : "未設定"} onPress={() => router.push("/edit/blood")} />
            <Row k="性別" v={genderLabel(u.gender)} onPress={() => router.push("/edit/gender")} />
            <Row k="起床時間" v={`${u.wakeUpTime}（通知 ${notifyTimeFrom(u.wakeUpTime)}）`} onPress={() => router.push("/edit/wakeup")} />
          </View>

          <Text style={s.sectionTitle}>今気になっていること</Text>
          <View style={s.themeRow}>
            {u.themes.length === 0 && <Text style={s.themeEmpty}>未設定</Text>}
            {u.themes.map((t) => (
              <View key={t} style={s.themeChip}><Text style={s.themeText}>{t}</Text></View>
            ))}
          </View>

          <View style={s.linkGroup}>
            <Pressable style={s.linkRow} onPress={() => router.push("/chart")} accessibilityRole="button">
              <Text style={s.linkText}>傾向メモ</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
            <Pressable style={s.linkRow} onPress={() => router.push("/calendar")} accessibilityRole="button">
              <Text style={s.linkText}>月間カレンダー</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
            <Pressable style={s.linkRow} onPress={() => router.push("/premium?source=profile")} accessibilityRole="button">
              <Text style={s.linkText}>プレミアムをはじめる</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
            <Pressable style={s.linkRowLast} onPress={() => router.push("/settings")} accessibilityRole="button">
              <Text style={s.linkText}>設定</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Row({ k, v, onPress }: { k: string; v: string; onPress?: () => void }) {
  if (onPress) {
    return (
      <Pressable style={s.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${k}を編集`}>
        <Text style={s.rowKey}>{k}</Text>
        <View style={s.rowValWrap}>
          <Text style={s.rowVal}>{v}</Text>
          <Text style={s.rowArrow}>›</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <View style={s.row}>
      <Text style={s.rowKey}>{k}</Text>
      <Text style={s.rowVal}>{v}</Text>
    </View>
  );
}
function genderLabel(g: string | null) {
  return ({ female: "女性", male: "男性", other: "その他", none: "選択しない" } as Record<string, string>)[g || ""] || "未設定";
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 64 },
  heading: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 3, marginTop: 18, paddingHorizontal: 6, fontWeight: "700" },
  title: { color: C.white, fontSize: 24, fontWeight: "800", letterSpacing: 4, marginBottom: 16, paddingHorizontal: 6, fontFamily: F.serif },
  card: { backgroundColor: "#FFF8EA", borderRadius: 16, padding: 23, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", shadowColor: "#42231A", shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  sectionLabel: { color: C.gold, fontSize: 9, letterSpacing: 4, fontFamily: F.serif },
  profileLead: { color: C.ink, fontSize: 14, lineHeight: 24, marginTop: 10, fontWeight: "700", fontFamily: F.serif },
  divider: { height: 1, backgroundColor: C.paperBorder, marginVertical: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, minHeight: 44 },
  rowKey: { color: "#9A6D2C", fontSize: 12, fontWeight: "800" },
  rowValWrap: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  rowVal: { color: C.ink, fontSize: 12, fontWeight: "700" },
  rowArrow: { color: C.inkMuted, fontSize: 14 },
  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 3, marginTop: 24, marginBottom: 10, paddingHorizontal: 6, fontFamily: F.serif },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 8 },
  themeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  themeText: { color: "#574740", fontSize: 11, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
  themeEmpty: { color: C.inkSub, fontSize: 12, opacity: 0.9, paddingHorizontal: 8, fontWeight: "600" },
  linkGroup: { marginTop: 24, backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", overflow: "hidden" },
  linkRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  linkRowLast: { flexDirection: "row", alignItems: "center", padding: 14 },
  linkText: { flex: 1, color: C.ink, fontSize: 13, fontWeight: "800" },
  linkArrow: { color: C.inkMuted, fontSize: 14 },
});
