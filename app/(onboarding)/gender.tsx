import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { C, F } from "../../lib/theme";

const GENDERS: { v: "female" | "male" | "other" | "none"; label: string }[] = [
  { v: "female", label: "女性" },
  { v: "male", label: "男性" },
  { v: "other", label: "その他" },
  { v: "none", label: "選択しない" },
];

export default function GenderStep() {
  const router = useRouter();
  const { gender, setField } = useUser();
  const select = (v: typeof GENDERS[number]["v"]) => {
    setField("gender", v);
    router.push("/(onboarding)/wake-up");
  };
  return (
    <OnboardShell
      step={5}
      title="性別を教えてください"
      sub="一部のメッセージや相性占いに使います"
      onNext={() => router.push("/(onboarding)/wake-up")}
      disabled={gender === null}
    >
      <View style={{ gap: 8 }}>
        {GENDERS.map((g) => {
          const on = gender === g.v;
          return (
            <Pressable key={g.v} onPress={() => select(g.v)} style={[s.row, on && s.rowOn]}>
              <Text style={[s.text, on && s.textOn]}>{g.label}</Text>
              {on && <Text style={s.check}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={s.note}>
        選択しない場合、性別に依存しないメッセージのみお届けします。
      </Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  row: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.white12, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  text: { color: C.white, fontSize: 15, fontFamily: F.serif },
  textOn: { color: C.ink, fontWeight: "600" },
  check: { color: C.red, fontSize: 14 },
  note: { color: C.white, fontSize: 11, opacity: 0.85, marginTop: 14, lineHeight: 20, padding: 12, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10 },
});
