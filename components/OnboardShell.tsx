import { ReactNode, useEffect } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { haptics } from "../lib/haptics";
import { track } from "../lib/analytics";
import { C, morningGradient, F } from "../lib/theme";

type Props = {
  step: number;
  total?: number;
  title: string;
  sub?: string;
  children: ReactNode;
  onNext: () => void;
  onSkip?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
};

export function OnboardShell({ step, total = 7, title, sub, children, onNext, onSkip, ctaLabel = "次へ", disabled }: Props) {
  const router = useRouter();
  useEffect(() => { track("onboarding_step_completed", { step, total }); }, [step]);
  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <SafeAreaView style={s.safe} edges={["top","bottom"]}>
        {/* Progress + Back */}
        <View style={s.progressRow}>
          {step > 1 && (
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="戻る">
              <Text style={s.backArrow}>‹</Text>
            </Pressable>
          )}
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[s.bar, i + 1 <= step && s.barOn]} />
          ))}
          <Text style={s.stepText}>{step}/{total}</Text>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>{title}</Text>
          {sub && <Text style={s.sub}>{sub}</Text>}
          <View style={{ marginTop: 22 }}>{children}</View>
        </ScrollView>

        <Pressable
          style={[s.cta, disabled && { opacity: 0.5 }]}
          onPress={() => { haptics.light(); onNext(); }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          accessibilityState={{ disabled }}
        >
          <Text style={s.ctaText}>{ctaLabel}</Text>
        </Pressable>

        {onSkip && (
          <Pressable
            onPress={() => { haptics.select(); onSkip(); }}
            style={s.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="この項目をスキップ"
          >
            <Text style={s.skipText}>スキップ</Text>
          </Pressable>
        )}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28, maxWidth: 480, width: "100%", alignSelf: "center" },
  progressRow: { flexDirection: "row", alignItems: "center", marginVertical: 24, gap: 4 },
  backArrow: { color: C.white, fontSize: 26, paddingRight: 8, fontWeight: "300" },
  bar: { flex: 1, height: 3, borderRadius: 2, marginRight: 6, backgroundColor: "rgba(255,255,255,0.25)" },
  barOn: { backgroundColor: "rgba(255,255,255,0.95)" },
  stepText: { color: C.white, fontSize: 10, opacity: 0.85, marginLeft: 4 },
  body: { paddingBottom: 24 },
  title: { color: C.white, fontSize: 22, lineHeight: 36, fontWeight: "500", fontFamily: F.serif },
  sub: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 12, lineHeight: 22, fontFamily: F.serif },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold, marginBottom: 8 },
  skipBtn: { paddingVertical: 8, alignItems: "center" },
  skipText: { color: C.inkSub, fontSize: 12, opacity: 0.95, fontWeight: "600", fontFamily: F.serif },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 3, fontFamily: F.serif },
});
