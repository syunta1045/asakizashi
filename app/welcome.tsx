import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

export default function Welcome() {
  const router = useRouter();
  const sunFade = useRef(new Animated.Value(0)).current;
  const sunRise = useRef(new Animated.Value(40)).current;
  const brandFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sunFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sunRise, { toValue: 0, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(brandFade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(ctaFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        {/* 中央の朝陽 */}
        <Animated.View style={[s.sunWrap, { opacity: sunFade, transform: [{ translateY: sunRise }] }]}>
          <View style={s.sunGlow} />
          <View style={s.sun} />
        </Animated.View>

        <View style={s.bottom}>
          <Animated.View style={{ opacity: brandFade }}>
            <Text style={s.tagline}>── A morning oracle ──</Text>
            <Text style={s.brand}>旭兆</Text>
            <Text style={s.brandRoman}>Asakizashi</Text>

            <Text style={s.lede}>
              毎朝、あなたへの{"\n"}一行のお告げをお届けします
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
              <Pressable onPress={() => router.push("/legal/terms")}>
                <Text style={s.legalLink}>利用規約</Text>
              </Pressable>
              <Text style={s.legalSep}>・</Text>
              <Pressable onPress={() => router.push("/legal/privacy")}>
                <Text style={s.legalLink}>プライバシーポリシー</Text>
              </Pressable>
              <Text style={s.legalSep}>・</Text>
              <Pressable onPress={() => router.push("/help")}>
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
  tagline: { color: C.white, fontSize: 12, opacity: 0.85, letterSpacing: 6, textAlign: "center", marginBottom: 14, fontFamily: F.serif },
  brand: { color: C.white, fontSize: 56, letterSpacing: 16, textAlign: "center", lineHeight: 60, fontFamily: F.serif, fontWeight: "500" },
  brandRoman: { color: C.white, fontSize: 11, letterSpacing: 3, textAlign: "center", marginTop: 14, opacity: 0.75 },
  lede: { color: C.white, fontSize: 14, lineHeight: 28, textAlign: "center", opacity: 0.95, marginVertical: 32, fontFamily: F.serif },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 6, fontFamily: F.serif },
  subLink: { color: C.white, fontSize: 11, textAlign: "center", marginTop: 14, opacity: 0.85 },
  legalRow: { flexDirection: "row", justifyContent: "center", marginTop: 18, gap: 6 },
  legalLink: { color: C.white, fontSize: 10, opacity: 0.7, textDecorationLine: "underline" },
  legalSep: { color: C.white, fontSize: 10, opacity: 0.5 },
});
