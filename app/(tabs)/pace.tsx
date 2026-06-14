import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { dayPillar } from "../../lib/bazi";
import { paceForDay, paceComment } from "../../lib/pace";
import { C, morningGradient, F } from "../../lib/theme";

const BASIS_NOTE = "生年月日は、朝のメッセージをあなた向けに整えるための入力です。結果を断定するものではなく、今日の過ごし方を考えるヒントとして使います。";

export default function Pace() {
  const router = useRouter();
  const { pillars } = useUser();

  const today = dayPillar(new Date());
  const paceEntries = paceForDay(today.branch);
  // 生年月日未入力時はデフォルトの「ほどよく進める」ペースを表示
  const myFlow = pillars
    ? (paceEntries.find((r) => r.branch === pillars.year.branch) ?? paceEntries[0])
    : { score: 70, position: 6 };
  const tempo = flowTempo(myFlow.score);
  const comment = pillars ? paceComment(myFlow.position) : "あなたに合わせた一行は、生年月日を入力するとより細かく整います。";

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Text style={s.dateLabel}>朝メモ</Text>
          <Text style={s.title}>今日のペース</Text>
        </View>

        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          <View style={s.basisNote}>
            <Text style={s.basisNoteText}>{BASIS_NOTE}</Text>
          </View>

          <View style={s.heroCard} accessibilityLabel={`今日のペースは${tempo.label}です`}>
            <Text style={s.heroLabel}>今日のペース</Text>
            <Text style={s.heroTitle}>{tempo.label}</Text>
            <Text style={s.heroText}>{tempo.body}</Text>
            <View style={s.flowTrack}>
              <View style={[s.flowFill, { width: `${tempo.width}%` }]} />
            </View>
            <Text style={s.flowNote}>{comment}</Text>
          </View>

          <Text style={s.sectionTitle}>時間帯ごとの使い方</Text>
          <View style={s.dayPartCard}>
            <DayPart label="朝" title="最初の予定を軽くする" body="やることを一つだけ選ぶと、午前の迷いが減ります。" />
            <DayPart label="昼" title="返事と確認を丁寧に" body="人とのやり取りは、短くても温度のある一言を。" />
            <DayPart label="夜" title="気分をひとこと残す" body="よかったこと、重かったことを一行だけ記録します。" last />
          </View>

          <Pressable style={s.cta} onPress={() => router.push("/journal")} accessibilityRole="button">
            <Text style={s.ctaText}>夜の振り返りを書く ›</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function flowTempo(score: number) {
  if (score >= 82) {
    return { label: "前向きに動く", width: 88, body: "今日は、少し早めに動くほど予定が進みやすい日です。" };
  }
  if (score >= 65) {
    return { label: "ほどよく進める", width: 66, body: "今日は、自分のペースを崩さず一つずつ整える日です。" };
  }
  return { label: "ゆっくり整える", width: 42, body: "今日は、予定を詰めすぎず余白を残すほど落ち着きやすい日です。" };
}

function DayPart({ label, title, body, last }: { label: string; title: string; body: string; last?: boolean }) {
  return (
    <View style={[s.dayPart, last && s.dayPartLast]}>
      <View style={s.dayPartBadge}>
        <Text style={s.dayPartBadgeText}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.dayPartTitle}>{title}</Text>
        <Text style={s.dayPartBody}>{body}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  dateLabel: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 3, fontFamily: F.serif, fontWeight: "700" },
  title: { color: C.white, fontSize: 24, fontWeight: "800", letterSpacing: 3, marginTop: 4, fontFamily: F.serif },
  list: { paddingHorizontal: 18, paddingBottom: 46, gap: 8 },
  basisNote: { paddingVertical: 11, paddingHorizontal: 13, borderRadius: 12, backgroundColor: "rgba(255,248,234,0.24)", borderWidth: 1, borderColor: "rgba(255,248,234,0.34)", marginBottom: 2 },
  basisNoteText: { color: "#FFF8EA", fontSize: 11, lineHeight: 18, fontWeight: "700", fontFamily: F.serif },
  heroCard: { backgroundColor: "#FFF8EA", borderRadius: 16, padding: 22, borderWidth: 1, borderColor: "rgba(126,88,48,0.2)", shadowColor: "#42231A", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } },
  heroLabel: { color: C.gold, fontSize: 10, letterSpacing: 3, fontWeight: "800", fontFamily: F.serif },
  heroTitle: { color: C.red, fontSize: 28, lineHeight: 36, marginTop: 8, fontWeight: "800", fontFamily: F.serif },
  heroText: { color: C.ink, fontSize: 13, lineHeight: 23, marginTop: 10, fontWeight: "700", fontFamily: F.serif },
  flowTrack: { marginTop: 16, height: 6, borderRadius: 3, backgroundColor: "rgba(184,150,86,0.18)", overflow: "hidden" },
  flowFill: { height: "100%", backgroundColor: C.red, borderRadius: 3 },
  flowNote: { color: C.inkSub, fontSize: 11, lineHeight: 18, marginTop: 10, fontWeight: "600", fontFamily: F.serif },
  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 2, marginTop: 18, marginBottom: 2, paddingHorizontal: 4, fontFamily: F.serif },
  dayPartCard: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", overflow: "hidden" },
  dayPart: { flexDirection: "row", gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  dayPartLast: { borderBottomWidth: 0 },
  dayPartBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(158,47,47,0.08)", borderWidth: 1, borderColor: "rgba(158,47,47,0.16)", alignItems: "center", justifyContent: "center" },
  dayPartBadgeText: { color: C.red, fontSize: 12, fontWeight: "800", fontFamily: F.serif },
  dayPartTitle: { color: C.ink, fontSize: 13, fontWeight: "800", fontFamily: F.serif },
  dayPartBody: { color: C.inkSub, fontSize: 12, lineHeight: 20, marginTop: 4, fontWeight: "600", fontFamily: F.serif },
  cta: { marginTop: 10, paddingVertical: 14, alignItems: "center", borderRadius: 24, backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  ctaText: { color: C.red, fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
});
