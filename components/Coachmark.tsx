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
};

export function Coachmark({ k, title, body }: Props) {
  const { seen, markSeen } = useCoachmark();
  if (seen[k]) return null;

  return (
    <Pressable style={s.overlay} onPress={() => markSeen(k)}>
      <View style={s.card}>
        <Text style={s.icon}>朝</Text>
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
  icon: { color: C.red, fontSize: 36, fontFamily: F.serif, marginBottom: 14 },
  title: { color: C.ink, fontSize: 16, fontWeight: "600", textAlign: "center", lineHeight: 26, fontFamily: F.serif },
  body: { color: C.inkSub, fontSize: 12, lineHeight: 22, textAlign: "center", marginTop: 12, fontFamily: F.serif },
  btn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: C.red },
  btnText: { color: C.white, fontSize: 12, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
});
