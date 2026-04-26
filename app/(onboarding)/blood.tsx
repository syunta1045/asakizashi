import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { C, F } from "../../lib/theme";

const BLOODS: { v: "A" | "B" | "O" | "AB" | "unknown"; label: string }[] = [
  { v: "A", label: "A型" },
  { v: "B", label: "B型" },
  { v: "O", label: "O型" },
  { v: "AB", label: "AB型" },
  { v: "unknown", label: "わからない" },
];

export default function BloodStep() {
  const router = useRouter();
  const { bloodType, setField } = useUser();
  const select = (v: typeof BLOODS[number]["v"]) => {
    setField("bloodType", v);
    router.push("/(onboarding)/gender");
  };
  return (
    <OnboardShell
      step={4}
      title="血液型を教えてください"
      sub="行動指針の出し方を細かく調整します"
      onNext={() => router.push("/(onboarding)/gender")}
      disabled={bloodType === null}
    >
      <View style={{ gap: 8 }}>
        {BLOODS.map((b) => {
          const on = bloodType === b.v;
          return (
            <Pressable key={b.v} onPress={() => select(b.v)} style={[s.row, on && s.rowOn]}>
              <Text style={[s.text, on && s.textOn]}>{b.label}</Text>
              {on && <Text style={s.check}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={s.note}>
        「わからない」を選んだ場合、{"\n"}
        血液型に依存しないメッセージになります。
      </Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  row: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.white12, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  text: { color: C.white, fontSize: 16, fontFamily: F.serif },
  textOn: { color: C.ink, fontWeight: "600" },
  check: { color: C.red, fontSize: 14 },
  note: { color: C.white, fontSize: 11, opacity: 0.85, marginTop: 14, lineHeight: 20, padding: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10 },
});
