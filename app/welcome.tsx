import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

export default function Welcome() {
  const router = useRouter();
  const sunFade = useRef(new Animated.Value(0)).current;
  const sunRise = useRef(new Animated.Value(40)).current;
  const brandFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sunFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(sunRise, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(220),
        Animated.timing(brandFade, { toValue: 1, duration: 520, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(460),
        Animated.timing(ctaFade, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        {/* 中央の朝陽 */}
        <Animated.View style={[s.sunWrap, { opacity: sunFade, transform: [{ translateY: sunRise }] }]}>
          <View style={s.sunGlow} />
          <View style={s.sun} />
        </Animated.View>

        <View style={s.bottom}>
          <Animated.View style={{ opacity: brandFade }}>
            <Text style={s.tagline}>── 今日を整える朝メモ ──</Text>
            <Text style={s.brand}>朝しるべ</Text>

            <Text style={s.lede}>
              朝のひとときに、{"\n"}今日のわたしを整える。
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: ctaFade }}>
            <Pressable
              style={s.cta}
              onPress={() => { haptics.light(); router.push("/(onboarding)/name"); }}
              accessibilityRole="button"
              accessibilityLabel="はじめる"
            >
              <Text style={s.ctaText}>はじめる</Text>
            </Pressable>
            <Pressable
              onPress={() => { haptics.light(); router.push("/(auth)/sign-in"); }}
              accessibilityRole="button"
              accessibilityLabel="サインインする"
            >
              <Text style={s.subLink}>すでにアカウントをお持ちの方</Text>
            </Pressable>

            <View style={s.legalRow}>
              <Pressable onPress={() => router.push("/legal/terms")} accessibilityRole="button">
                <Text style={s.legalLink}>利用規約</Text>
              </Pressable>
              <Text style={s.legalSep}>・</Text>
              <Pressable onPress={() => router.push("/legal/privacy")} accessibilityRole="button">
                <Text style={s.legalLink}>プライバシーポリシー</Text>
              </Pressable>
              <Text style={s.legalSep}>・</Text>
              <Pressable onPress={() => router.push("/help")} accessibilityRole="button">
                <Text style={s.legalLink}>ヘルプ</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28, maxWidth: 480, width: "100%", alignSelf: "center" },
  sunWrap: { alignItems: "center", marginTop: 80 },
  sunGlow: {
    position: "absolute", top: 0, width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,216,158,0.55)",
  },
  sun: {
    width: 70, height: 70, borderRadius: 35, marginTop: 20,
    backgroundColor: "#FFE4A8",
    shadowColor: "#FFD89E", shadowOpacity: 0.8, shadowRadius: 30, shadowOffset: { width: 0, height: 0 },
  },
  bottom: { flex: 1, justifyContent: "flex-end", paddingBottom: 30 },
  tagline: { color: "#FFF8EA", fontSize: 12, opacity: 0.96, letterSpacing: 6, textAlign: "center", marginBottom: 14, fontFamily: F.serif, fontWeight: "800" },
  brand: { color: C.white, fontSize: 52, letterSpacing: 8, textAlign: "center", lineHeight: 62, fontFamily: F.serif, fontWeight: "800" },
  lede: { color: C.white, fontSize: 15, lineHeight: 29, textAlign: "center", opacity: 0.98, marginVertical: 32, fontFamily: F.serif, fontWeight: "600" },
  cta: { backgroundColor: "#FFF8EA", borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "800", letterSpacing: 6, fontFamily: F.serif },
  subLink: { color: "#FFF8EA", fontSize: 11, textAlign: "center", marginTop: 14, opacity: 0.95, fontWeight: "800" },
  legalRow: { flexDirection: "row", justifyContent: "center", marginTop: 18, gap: 6 },
  legalLink: { color: C.inkSub, fontSize: 10, opacity: 0.85, textDecorationLine: "underline" },
  legalSep: { color: C.inkMuted, fontSize: 10, opacity: 0.8 },
});
