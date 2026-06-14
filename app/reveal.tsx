import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../lib/store";
import { track } from "../lib/analytics";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

export default function Reveal() {
  const router = useRouter();
  const { nickname, pillars, finishOnboarding } = useUser();

  // 入場アニメーション
  const headerFade = useRef(new Animated.Value(0)).current;
  const dayScale = useRef(new Animated.Value(0.8)).current;
  const dayFade = useRef(new Animated.Value(0)).current;
  const messageFade = useRef(new Animated.Value(0)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    haptics.success();
    Animated.sequence([
      Animated.timing(headerFade, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(dayFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dayScale, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(messageFade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(ctaFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  // pillars 未生成（生年月日未入力時）でも reveal を表示する
  const onContinue = async () => {
    haptics.medium();
    track("onboarding_completed", {
      dayPillar: pillars ? `${pillars.day.stem}${pillars.day.branch}` : "(none)",
    });
    finishOnboarding();
    router.replace("/today");
  };

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <Animated.View style={[s.header, { opacity: headerFade }]}>
          <Text style={s.headerLabel}>── 朝の準備ができました ──</Text>
        </Animated.View>

        <Animated.View style={[s.center, { opacity: dayFade, transform: [{ scale: dayScale }] }]}>
          <View style={s.markHalo}>
            <View style={s.cardMark}>
              <View style={s.sunMark} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[s.message, { opacity: messageFade }]}>
          <Text style={s.headline}>
            {(nickname || "あなた")}さんの朝に合わせて{"\n"}朝メモを整えました。
          </Text>
          <Text style={s.lede}>
            起きる時間と今の関心に合わせて、{"\n"}毎朝そっとお届けします。
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: ctaFade }}>
          <Pressable
            style={s.cta}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="朝メモを見る"
          >
            <Text style={s.ctaText}>朝メモを見る</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28, paddingBottom: 30, maxWidth: 480, width: "100%", alignSelf: "center" },
  header: { alignItems: "center", marginTop: 60 },
  headerLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 4, fontFamily: F.serif },
  center: { alignItems: "center", marginTop: 52 },
  markHalo: { width: 168, height: 168, borderRadius: 84, backgroundColor: "rgba(250,244,224,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  cardMark: { width: 88, height: 112, borderRadius: 18, backgroundColor: C.paper, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-3deg" }], borderWidth: 1, borderColor: C.paperBorder },
  sunMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#F1B95F" },
  message: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  headline: { color: C.white, fontSize: 18, lineHeight: 32, fontWeight: "500", textAlign: "center", fontFamily: F.serif },
  lede: { color: C.white, fontSize: 12, opacity: 0.85, lineHeight: 24, marginTop: 14, textAlign: "center", fontFamily: F.serif },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 3, fontFamily: F.serif },
});
