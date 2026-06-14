/**
 * 初回コーチマーク（オーバーレイ）
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useCoachmark, type CoachKey } from "../lib/coachmark";
import { C, F } from "../lib/theme";

type Props = {
  k: CoachKey;
  title: string;
  body: string;
  onDismiss?: () => void;
};

export function Coachmark({ k, title, body, onDismiss }: Props) {
  const { seen, markSeen } = useCoachmark();
  if (seen[k]) return null;

  const dismiss = () => {
    markSeen(k);
    onDismiss?.();
  };

  return (
    <Pressable style={s.overlay} onPress={dismiss}>
      <View style={s.card}>
        <View style={s.iconWrap}>
          <View style={s.iconCard}>
            <View style={s.iconSun} />
          </View>
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        <View style={s.btn}>
          <Text style={s.btnText}>わかりました</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center", padding: 28, zIndex: 100,
  },
  card: { backgroundColor: C.paper, borderRadius: 18, padding: 28, alignItems: "center", borderWidth: 1, borderColor: C.paperBorder, maxWidth: 320 },
  iconWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(168,131,64,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  iconCard: { width: 34, height: 44, borderRadius: 9, backgroundColor: C.white, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-4deg" }], borderWidth: 1, borderColor: C.paperBorder },
  iconSun: { width: 21, height: 21, borderRadius: 11, backgroundColor: "#F1B95F" },
  title: { color: C.ink, fontSize: 16, fontWeight: "600", textAlign: "center", lineHeight: 26, fontFamily: F.serif },
  body: { color: C.inkSub, fontSize: 12, lineHeight: 22, textAlign: "center", marginTop: 12, fontFamily: F.serif },
  btn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: C.red },
  btnText: { color: C.white, fontSize: 12, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
