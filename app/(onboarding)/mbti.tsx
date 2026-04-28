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

      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>または</Text>
        <View style={s.dividerLine} />
      </View>

      <Pressable
        onPress={() => select(null)}
        style={[s.skip, mbti === null && s.skipActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: mbti === null }}
      >
        <Text style={[s.skipText, mbti === null && s.skipTextActive]}>
          わからないので設定しない
        </Text>
      </Pressable>

      <Text style={s.hint}>
        この場合、性格に依存しないメッセージをお届けします
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
  divider: { flexDirection: "row", alignItems: "center", marginTop: 22, marginBottom: 10, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  dividerText: { color: C.white, fontSize: 10, opacity: 0.7, letterSpacing: 2, fontFamily: F.serif },
  skip: { paddingVertical: 12, alignItems: "center", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.35)", borderStyle: "dashed" },
  skipActive: { backgroundColor: C.white95, borderColor: C.gold, borderStyle: "solid" },
  skipText: { color: C.white, fontSize: 13, opacity: 0.85, fontFamily: F.serif },
  skipTextActive: { color: C.red, fontWeight: "600", opacity: 1 },
  hint: { color: C.white, fontSize: 11, opacity: 0.75, marginTop: 14, lineHeight: 20, textAlign: "center" },
});
