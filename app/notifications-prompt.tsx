import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { requestNotificationPermission, scheduleMorningNotification } from "../lib/notifications";
import { useUser, notifyTimeFrom } from "../lib/store";
import { useCoachmark } from "../lib/coachmark";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

export default function NotificationsPrompt() {
  const router = useRouter();
  const { wakeUpTime, nickname, setField } = useUser();
  const markSeen = useCoachmark((s) => s.markSeen);
  const notifyAt = notifyTimeFrom(wakeUpTime);

  const onAllow = async () => {
    haptics.light();
    markSeen("notification_prompt");
    const granted = await requestNotificationPermission();
    if (granted) {
      setField("morningEnabled", true);
      await scheduleMorningNotification(wakeUpTime, nickname);
    }
    router.back();
  };

  const onSkip = () => {
    haptics.light();
    markSeen("notification_prompt");
    router.back();
  };

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <View style={s.iconWrap}>
            <View style={s.iconCard}>
              <View style={s.iconSun} />
            </View>
          </View>
          <Text style={s.title}>朝メモを受け取りますか？</Text>
          <Text style={s.body}>
            起床時刻の10分後（{notifyAt}）に、{"\n"}
            今日を整える小さなメモを届けます。
          </Text>
          <Text style={s.note}>
            通知はいつでも設定から止められます。
          </Text>
        </View>
        <View style={s.bottom}>
          <Pressable style={s.cta} onPress={onAllow} accessibilityRole="button">
            <Text style={s.ctaText}>通知を受け取る</Text>
          </Pressable>
          <Pressable onPress={onSkip} accessibilityRole="button">
            <Text style={s.skip}>あとで設定する</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 124, height: 124, borderRadius: 62, backgroundColor: "rgba(250,244,224,0.14)", alignItems: "center", justifyContent: "center", marginBottom: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  iconCard: { width: 58, height: 74, borderRadius: 14, backgroundColor: C.paper, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }], borderWidth: 1, borderColor: C.paperBorder },
  iconSun: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1B95F" },
  title: { color: C.white, fontSize: 18, lineHeight: 28, fontWeight: "600", textAlign: "center", fontFamily: F.serif },
  body: { color: C.white, fontSize: 13, lineHeight: 24, opacity: 0.9, textAlign: "center", marginTop: 14, fontFamily: F.serif },
  note: { color: C.white, fontSize: 11, lineHeight: 20, opacity: 0.72, textAlign: "center", marginTop: 10, fontFamily: F.serif },
  bottom: { paddingBottom: 30, gap: 12 },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 3, fontFamily: F.serif },
  skip: { color: C.inkSub, fontSize: 12, opacity: 0.95, textAlign: "center", paddingVertical: 12, fontWeight: "600", fontFamily: F.serif },
});
