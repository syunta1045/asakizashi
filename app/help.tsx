import { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, dawnGradient, F } from "../lib/theme";

const FAQ: { q: string; a: string }[] = [
  {
    q: "旭兆って何ですか？",
    a: "毎朝、四柱推命の命式と当日の干支から「今日のお告げ」を一行でお届けする占いアプリです。設定した起床時刻の10分後にプッシュ通知が届きます。",
  },
  {
    q: "命式って？",
    a: "生年月日から算出される、あなただけの「気の構成」のようなもの。年柱・月柱・日柱という3つの干支の組み合わせで表されます。旭兆では時刻不要で、年・月・日柱のみを使います。",
  },
  {
    q: "MBTIや血液型は何に使われますか？",
    a: "命式から導かれた基本メッセージのトーンを、性格や気質に合わせて自然な語り口に調整するために使います。「設定しない」も選べます。",
  },
  {
    q: "通知が届かないのですが",
    a: "「設定 > 通知」から起床時間と通知のオン・オフをご確認ください。スマートフォンの「設定 > 通知 > 旭兆」も合わせてご確認ください。",
  },
  {
    q: "MBTIや血液型は科学的に正しいですか？",
    a: "いえ、科学的根拠は必ずしもありません。旭兆は「占い・娯楽」を目的とした体験です。日々の気づきや内省のきっかけとしてお楽しみください。",
  },
  {
    q: "プレミアムを解約したい",
    a: "iOSの場合は「App Store > Apple ID > サブスクリプション」、Androidの場合は「Play ストア > メニュー > お支払いと定期購入」から解約できます。アプリからは直接解約できません。",
  },
  {
    q: "推しやペットも登録できますか？",
    a: "はい。「つながり」タブから、大切な人・推し（アイドル等）・仕事の関係・ペット・大切な日（記念日）など8ジャンルを登録できます。",
  },
  {
    q: "アプリを削除したらデータは消えますか？",
    a: "未サインインの場合はデバイスから消えます。サインイン済みの場合はサーバーに残るので、設定から「アカウントを完全に削除」してください。",
  },
  {
    q: "占いの結果は当たりますか？",
    a: "メッセージは四柱推命の伝統的な読み解きを大切に組み立てています。未来を断定するものではなく、今日一日を整えるヒント、自分と向き合うきっかけとして寄り添えれば幸いです。",
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
            <Text style={s.dateLabel}>HELP & FAQ</Text>
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
