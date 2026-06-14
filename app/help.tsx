import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, dawnGradient, F } from "../lib/theme";

const FAQ: { q: string; a: string }[] = [
  {
    q: "朝しるべって何ですか？",
    a: "毎朝、今日を整える朝メモと小さな行動ヒントを届けるセルフケア・振り返りアプリです。設定した起床時刻の10分後にプッシュ通知が届きます。",
  },
  {
    q: "生年月日は何に使いますか？",
    a: "朝メモを、あなた向けの言葉に整えるために使います。生まれた時刻は不要です。未来を断定するためではなく、朝の振り返りや行動ヒントを調整するための情報です。",
  },
  {
    q: "MBTIや血液型は何に使われますか？",
    a: "毎朝のメッセージのトーンを、性格や気質に合わせて自然な語り口に調整するために使います。「わからない」を選んでもOKです。",
  },
  {
    q: "通知が届かないのですが",
    a: "アプリ内の「設定」から「通知の設定」を開くと、通知の予定を確認できます。届かない場合は「通知をためしてみる」を試し、スマートフォン側の通知設定も確認してください。",
  },
  {
    q: "MBTIや血液型は科学的に正しいですか？",
    a: "科学的に性格や未来を断定するものではありません。日々の気づきや内省のきっかけとしてお楽しみください。",
  },
  {
    q: "プレミアムを解約したい",
    a: "iOSの場合は「App Store > Apple ID > サブスクリプション」、Androidの場合は「Play ストア > メニュー > お支払いと定期購入」から解約できます。アプリからは直接解約できません。",
  },
  {
    q: "推しやペットも登録できますか？",
    a: "はい。「つながり」タブから、大切な人・推し・仕事の関係・ペット・記念日を登録できます。",
  },
  {
    q: "アプリを削除したらデータは消えますか？",
    a: "未サインインの場合はデバイスから消えます。サインイン済みの場合はサーバーに残るので、設定から「アカウントを完全に削除」してください。",
  },
  {
    q: "朝メモは予測ですか？",
    a: "未来を断定するものではありません。今日一日を整えるヒントとして、自分と向き合うきっかけにしていただければ幸いです。",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.item}>
      <Pressable
        onPress={() => setOpen(!open)}
        style={s.qRow}
        accessibilityRole="button"
        accessibilityLabel={`${q} ${open ? "を閉じる" : "を開く"}`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={s.q}>{q}</Text>
        <Text style={s.toggle}>{open ? "−" : "＋"}</Text>
      </Pressable>
      {open && <Text style={s.a}>{a}</Text>}
    </View>
  );
}

export default function Help() {
  const router = useRouter();
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>お困りのときは</Text>
            <Text style={s.title}>よくあるご質問</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.list}>
            {FAQ.map((item, i) => <Item key={i} {...item} />)}
          </View>

          <View style={s.contactBlock}>
            <Text style={s.contactText}>解決しなかった場合は</Text>
            <Pressable onPress={() => router.push("/contact")} accessibilityRole="button">
              <Text style={s.contactLink}>お問い合わせへ ›</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
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
  list: { backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  item: { borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  qRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  q: { flex: 1, color: C.ink, fontSize: 13, fontWeight: "600", fontFamily: F.serif },
  toggle: { color: C.gold, fontSize: 18, width: 20, textAlign: "center" },
  a: { color: C.inkSub, fontSize: 12, lineHeight: 22, padding: 16, paddingTop: 0, fontFamily: F.serif },
  contactBlock: { marginTop: 24, alignItems: "center", paddingVertical: 14 },
  contactText: { color: C.white, fontSize: 12, opacity: 0.85, fontFamily: F.serif },
  contactLink: { color: C.white, fontSize: 13, fontWeight: "600", marginTop: 6, textDecorationLine: "underline", fontFamily: F.serif },
});
