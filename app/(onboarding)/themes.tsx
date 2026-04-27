import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { C, F } from "../../lib/theme";

const THEMES = [
  "恋愛・パートナーシップ",
  "結婚・家庭",
  "子育て・家族",
  "仕事・キャリア",
  "副業・独立",
  "お金・金運",
  "勝負・運気",
  "人間関係",
  "学び・成長",
  "創作・表現",
  "趣味・楽しみ",
  "旅・冒険",
  "健康・体調",
  "メンタル・心",
  "美容・ライフスタイル",
  "食・暮らし",
  "推し・ファン活動",
  "スピリチュアル",
];

export default function ThemesStep() {
  const router = useRouter();
  const { themes, setField } = useUser();

  const toggle = (t: string) => {
    if (themes.includes(t)) {
      setField("themes", themes.filter((x) => x !== t));
    } else if (themes.length < 3) {
      setField("themes", [...themes, t]);
    }
  };

  const onNext = () => {
    router.push("/confirm");
  };

  return (
    <OnboardShell
      step={7}
      title={"気になっていることを\n教えてください"}
      sub="毎朝のメッセージの主題に反映します（最大3つ）"
      onNext={onNext}
      ctaLabel="入力内容を確認"
      disabled={themes.length === 0}
    >
      <View style={s.grid}>
        {THEMES.map((t) => {
          const on = themes.includes(t);
          return (
            <Pressable key={t} onPress={() => toggle(t)} style={[s.chip, on && s.chipOn]} accessibilityRole="button">
              {on && <Text style={s.check}>✓</Text>}
              <Text style={[s.chipText, on && s.chipTextOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.counter}>{themes.length} / 3 選択中</Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  chipText: { color: C.white, fontSize: 12, fontFamily: F.serif },
  chipTextOn: { color: C.ink, fontWeight: "600" },
  check: { color: C.red, fontSize: 12 },
  counter: { color: C.white, fontSize: 11, opacity: 0.85, textAlign: "center", marginTop: 18 },
});
