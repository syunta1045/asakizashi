import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { C, dawnGradient, F } from "../lib/theme";

const SUPPORT_EMAIL = "support@asakizashi.app";

export default function Contact() {
  const router = useRouter();
  const version = Constants.expoConfig?.version || "0.1.0";

  const onMail = (subject: string) => {
    const body = encodeURIComponent(
      `\n\n---\nアプリバージョン: ${version}\nプラットフォーム: ${Platform.OS} ${Platform.Version}\n`
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`);
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>SUPPORT</Text>
            <Text style={s.title}>お問い合わせ</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.lede}>
            ご質問・ご不具合・ご要望など、{"\n"}
            お気軽にご連絡ください。
          </Text>

          <View style={s.group}>
            <Pressable style={s.row} onPress={() => onMail("【旭兆】不具合の報告")} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>不具合を報告する</Text>
                <Text style={s.rowSub}>表示や挙動の問題があれば</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </Pressable>
            <Pressable style={s.row} onPress={() => onMail("【旭兆】機能のご要望")} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>機能のご要望</Text>
                <Text style={s.rowSub}>こんな機能が欲しい、等</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </Pressable>
            <Pressable style={s.row} onPress={() => onMail("【旭兆】お問い合わせ")} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>その他のお問い合わせ</Text>
                <Text style={s.rowSub}>{SUPPORT_EMAIL}</Text>
              </View>
              <Text style={s.arrow}>›</Text>
            </Pressable>
          </View>

          <Text style={s.note}>
            メールアプリが起動します。{"\n"}
            返信までに2〜3営業日をいただく場合があります。
          </Text>
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
  lede: { color: C.white, fontSize: 13, lineHeight: 24, textAlign: "center", paddingVertical: 18, fontFamily: F.serif },
  group: { backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.paperBorder, gap: 12 },
  rowTitle: { color: C.ink, fontSize: 14, fontWeight: "600", fontFamily: F.serif },
  rowSub: { color: C.inkSub, fontSize: 11, marginTop: 2 },
  arrow: { color: C.inkMuted, fontSize: 14 },
  note: { color: C.white, fontSize: 11, opacity: 0.85, textAlign: "center", marginTop: 18, lineHeight: 20, fontFamily: F.serif },
});
