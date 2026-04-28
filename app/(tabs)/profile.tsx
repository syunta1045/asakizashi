import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../../lib/store";
import { stemReading, branchReading } from "../../lib/bazi";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Profile() {
  const router = useRouter();
  const u = useUser();
  if (!u.pillars) return null;
  const day = u.pillars.day;
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.heading}>YOUR PROFILE</Text>
          <Text style={s.title}>あなたのこと</Text>

          <View style={s.card}>
            <Text style={s.sectionLabel}>◆ 命 式</Text>
            <Text style={s.dayPillar}>{day.stem}{day.branch}</Text>
            <Text style={s.dayReading}>{stemReading[day.stem]}・{branchReading[day.branch]} 日柱</Text>

            <View style={s.divider} />
            <Row k="ニックネーム" v={u.nickname} />
            <Row k="生年月日" v={`${u.birthYear}年${u.birthMonth}月${u.birthDay}日`} />
            <Row k="生まれた場所" v={u.birthPlace} />
            <Row k="MBTI" v={u.mbti || "未設定"} />
            <Row k="血液型" v={u.bloodType ? (u.bloodType === "unknown" ? "わからない" : `${u.bloodType}型`) : "未設定"} />
            <Row k="性別" v={genderLabel(u.gender)} />
            <Row k="起床時間" v={`${u.wakeUpTime}（通知 ${notifyTimeFrom(u.wakeUpTime)}）`} />
          </View>

          <Text style={s.sectionTitle}>気にしていること</Text>
          <View style={s.themeRow}>
            {u.themes.length === 0 && <Text style={s.themeEmpty}>未設定</Text>}
            {u.themes.map((t) => (
              <View key={t} style={s.themeChip}><Text style={s.themeText}>{t}</Text></View>
            ))}
          </View>

          <View style={s.linkGroup}>
            <Pressable style={s.linkRow} onPress={() => router.push("/chart")} accessibilityRole="button">
              <Text style={s.linkText}>命式の詳細を見る</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
            <Pressable style={s.linkRow} onPress={() => router.push("/calendar")} accessibilityRole="button">
              <Text style={s.linkText}>月の流れ</Text>
              <Text style={s.linkArrow}>›</Text>
            </Pressable>
            <Pressable style={s.linkRow} onPress={() => router.push("/premium")} accessibilityRole="button">
              <Text style={s.linkText}>プレミアムにアップグレード</Text>
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

function Row({ k, v }: { k: string; v: string }) {
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
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  heading: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3, marginTop: 14, paddingHorizontal: 8 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginBottom: 14, paddingHorizontal: 8, fontFamily: F.serif },
  card: { backgroundColor: C.paper, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: C.paperBorder },
  sectionLabel: { color: C.gold, fontSize: 9, letterSpacing: 4, fontFamily: F.serif },
  dayPillar: { color: C.red, fontSize: 50, fontWeight: "600", letterSpacing: 4, lineHeight: 56, marginTop: 12, textAlign: "center", fontFamily: F.serif },
  dayReading: { color: C.inkSub, fontSize: 11, textAlign: "center", marginTop: 6, letterSpacing: 2, fontFamily: F.serif },
  divider: { height: 1, backgroundColor: C.paperBorder, marginVertical: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowKey: { color: C.gold, fontSize: 12 },
  rowVal: { color: C.ink, fontSize: 12 },
  sectionTitle: { color: C.white, fontSize: 13, fontWeight: "500", letterSpacing: 3, marginTop: 24, marginBottom: 10, paddingHorizontal: 8, fontFamily: F.serif },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 8 },
  themeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: C.whiteBorder },
  themeText: { color: C.white, fontSize: 11, letterSpacing: 1, fontFamily: F.serif },
  themeEmpty: { color: C.white, fontSize: 12, opacity: 0.7, paddingHorizontal: 8 },
  linkGroup: { marginTop: 24, backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  linkRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  linkRowLast: { flexDirection: "row", alignItems: "center", padding: 14 },
  linkText: { flex: 1, color: C.ink, fontSize: 13, fontWeight: "500" },
  linkArrow: { color: C.inkMuted, fontSize: 14 },
});
