import { View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { requestNotificationPermission, scheduleMorningNotification } from "../lib/notifications";
import { useUser, notifyTimeFrom } from "../lib/store";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

export default function NotificationsPrompt() {
  const router = useRouter();
  const { wakeUpTime, nickname } = useUser();
  const notifyAt = notifyTimeFrom(wakeUpTime);

  const onAllow = async () => {
    haptics.light();
    const granted = await requestNotificationPermission();
    if (granted) {
      await scheduleMorningNotification(wakeUpTime, nickname);
    }
    router.back();
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.icon}>朝</Text>
          <Text style={s.title}>毎朝のお告げを受け取りますか？</Text>
          <Text style={s.body}>
            起床時刻の10分後（{notifyAt}）に、{"\n"}
            その日のメッセージを通知でお届けします。
          </Text>
        </View>
        <View style={s.bottom}>
          <Pressable style={s.cta} onPress={onAllow}>
            <Text style={s.ctaText}>通知を受け取る</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
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
  icon: { color: C.white, fontSize: 64, fontFamily: F.serif, marginBottom: 28, opacity: 0.95 },
  title: { color: C.white, fontSize: 18, lineHeight: 28, fontWeight: "500", textAlign: "center", fontFamily: F.serif },
  body: { color: C.white, fontSize: 13, lineHeight: 24, opacity: 0.9, textAlign: "center", marginTop: 14, fontFamily: F.serif },
  bottom: { paddingBottom: 30, gap: 12 },
  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 6, fontFamily: F.serif },
  skip: { color: C.white, fontSize: 12, opacity: 0.85, textAlign: "center", paddingVertical: 12, fontFamily: F.serif },
});
