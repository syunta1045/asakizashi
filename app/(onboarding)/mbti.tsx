import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { C, F } from "../../lib/theme";

const TYPES = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];

export default function MbtiStep() {
  const router = useRouter();
  const { mbti, setField } = useUser();
  const select = (v: string | null) => {
    setField("mbti", v);
    router.push("/(onboarding)/blood");
  };
  return (
    <OnboardShell
      step={3}
      title={"MBTIを\n教えてください"}
      sub="性格に合わせてメッセージのトーンを変えます"
      onNext={() => router.push("/(onboarding)/blood")}
    >
      <View style={s.grid}>
        {TYPES.map((t) => {
          const on = mbti === t;
          return (
            <Pressable key={t} onPress={() => select(t)} style={[s.cell, on && s.cellActive]} accessibilityRole="button">
              <Text style={[s.text, on && s.textActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => select(null)}
        style={[s.skip, mbti === null && s.cellActive]}
      accessibilityRole="button">
        <Text style={[s.skipText, mbti === null && s.textActive]}>わからない</Text>
      </Pressable>

      <Text style={s.hint}>
        わからない場合、性格に依存しないメッセージになります
      </Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "23.5%", paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: C.white12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  cellActive: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  text: { color: C.white, fontSize: 11, fontWeight: "600" },
  textActive: { color: C.red },
  skip: { marginTop: 12, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: C.white12, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  skipText: { color: C.white, fontSize: 12, fontFamily: F.serif },
  hint: { color: C.white, fontSize: 11, opacity: 0.85, marginTop: 14, lineHeight: 20, textAlign: "center" },
});
