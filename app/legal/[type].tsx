import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TERMS_TEXT, PRIVACY_TEXT } from "../../lib/legal";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Legal() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "プライバシーポリシー" : "利用規約";
  const text = isPrivacy ? PRIVACY_TEXT : TERMS_TEXT;

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <Text style={s.title}>{title}</Text>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.card}>
            <Text style={s.body}>{text}</Text>
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
  title: { color: C.white, fontSize: 18, fontWeight: "500", letterSpacing: 3, fontFamily: F.serif },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  card: { backgroundColor: C.paper, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: C.paperBorder },
  body: { color: C.ink, fontSize: 12, lineHeight: 22, fontFamily: F.serif },
});
