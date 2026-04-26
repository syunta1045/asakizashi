import { useEffect, useRef } from "react";
import { Text, Pressable, Animated, Easing, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../lib/store";
import { stemReading, branchReading } from "../lib/bazi";
import { requestNotificationPermission, scheduleMorningNotification } from "../lib/notifications";
import { track } from "../lib/analytics";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

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
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(dayFade, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(dayScale, { toValue: 1, duration: 1000, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      ]),
      // メッセージとCTAを並行フェードイン（CTAは少し遅れて開始するが、メッセージが100%になる前に出現）
      Animated.parallel([
        Animated.timing(messageFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(ctaFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  if (!pillars) return null;
  const { day } = pillars;
  const reading = `${stemReading[day.stem]}・${branchReading[day.branch]}`;

  const onContinue = async () => {
    haptics.medium();
    track("onboarding_completed", { dayPillar: `${day.stem}${day.branch}` });
    finishOnboarding();
    // 通知権限を取得してスケジュール（拒否されてもスキップして続行）
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        const u = useUser.getState();
        await scheduleMorningNotification(u.wakeUpTime, u.nickname);
      }
    } catch {}
    router.replace("/today");
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <Animated.View style={[s.header, { opacity: headerFade }]}>
          <Text style={s.headerLabel}>── {nickname || "あなた"}さんの命式 ──</Text>
        </Animated.View>

        <Animated.View style={[s.center, { opacity: dayFade, transform: [{ scale: dayScale }] }]}>
          <Text style={s.day}>{day.stem}{day.branch}</Text>
          <Text style={s.reading}>{reading}</Text>
        </Animated.View>

        <Animated.View style={[s.message, { opacity: messageFade }]}>
          <Text style={s.headline}>
            あなたの日柱は{"\n"}{day.stem}{day.branch}でした。
          </Text>
          <Text style={s.lede}>
            この命式から、毎朝の{"\n"}一行のお告げをお届けします。
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: ctaFade }}>
          <Pressable
            style={s.cta}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="今日のお告げを見る"
          >
            <Text style={s.ctaText}>今日のお告げを見る</Text>
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
  headerLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 6, fontFamily: F.serif },
  center: { alignItems: "center", marginTop: 30 },
  day: { color: C.white, fontSize: 96, letterSpacing: 12, lineHeight: 100, fontFamily: F.serif, fontWeight: "300" },
  reading: { color: C.white, fontSize: 11, marginTop: 12, opacity: 0.85, letterSpacing: 4, fontFamily: F.serif },
  message: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  headline: { color: C.white, fontSize: 18, lineHeight: 32, fontWeight: "500", textAlign: "center", fontFamily: F.serif },
  lede: { color: C.white, fontSize: 12, opacity: 0.85, lineHeight: 24, marginTop: 14, textAlign: "center", fontFamily: F.serif },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 6, fontFamily: F.serif },
});
