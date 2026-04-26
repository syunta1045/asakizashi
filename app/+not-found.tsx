import { Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { C, dawnGradient, F } from "../lib/theme";

export default function NotFound() {
  const router = useRouter();
  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <Text style={s.title}>道に迷いました</Text>
        <Text style={s.body}>このページは見つかりませんでした。</Text>
        <Pressable style={s.btn} onPress={() => router.replace("/today")}>
          <Text style={s.btnText}>今日の画面に戻る</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, textAlign: "center", fontFamily: F.serif },
  body: { color: C.white, fontSize: 13, marginTop: 12, opacity: 0.85, textAlign: "center", fontFamily: F.serif },
  btn: { marginTop: 28, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.paper, borderRadius: 24, borderWidth: 1, borderColor: C.gold },
  btnText: { color: C.ink, fontSize: 13, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
