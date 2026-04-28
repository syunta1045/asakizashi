import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { useRelations, GENRE_INFO, compatibility, RelationLimitError, FREE_RELATION_LIMIT, type Genre } from "../../lib/relations";
import { useSubscription } from "../../lib/subscription";
import { C, dawnGradient, F } from "../../lib/theme";

const SUB_LABELS: Record<Genre, string[]> = {
  person: ["夫", "妻", "恋人", "家族", "子ども", "友人"],
  oshi: ["アイドル", "俳優", "アーティスト", "声優", "スポーツ選手", "キャラ"],
  work: ["上司", "部下", "取引先", "クライアント", "同僚"],
  key_day: ["結婚した日", "転職日", "開業日", "出会った日", "引越し日"],
  pet: ["犬", "猫", "うさぎ", "鳥", "その他"],
  first_meet: ["初対面", "お見合い", "気になる人"],
  past: ["元恋人", "故人", "ご先祖"],
  place: ["お店", "会社", "住んでいる場所"],
};

export default function AddRelation() {
  const router = useRouter();
  const { pillars } = useUser();
  const { add } = useRelations();
  const isPremium = useSubscription((s) => s.isPremium);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [genre, setGenre] = useState<Genre | null>(null);
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState(1995);
  const [month, setMonth] = useState(7);
  const [day, setDay] = useState(12);

  // 月・年に応じた当月の最大日数（うるう年も考慮）
  const dayMax = new Date(year, month, 0).getDate();
  // birthDay が dayMax を超えていたら自動クランプ（2/31 → 2/28 等）
  useEffect(() => {
    if (day > dayMax) setDay(dayMax);
  }, [year, month, dayMax]);

  const onSave = () => {
    if (!genre || !pillars) return;
    try {
      const r = add({
        genre, label: label || GENRE_INFO[genre].label,
        name, birthYear: year, birthMonth: month, birthDay: day,
      }, isPremium);
      compatibility(pillars.day.branch, r.pillars.day.branch);
      router.replace("/(tabs)/relations");
    } catch (e) {
      if (e instanceof RelationLimitError) {
        Alert.alert(
          "登録上限に達しました",
          `無料プランでは${FREE_RELATION_LIMIT}件まで登録できます。プレミアムにアップグレードすると無制限になります。`,
          [
            { text: "キャンセル", style: "cancel" },
            { text: "プレミアムを見る", onPress: () => router.replace("/premium") },
          ]
        );
        return;
      }
      Alert.alert("登録に失敗しました", "もう一度お試しください。");
    }
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View style={s.headerRow}>
          <Pressable onPress={() => step === 1 ? router.back() : setStep((step - 1) as 1 | 2 | 3)} accessibilityRole="button">
            <Text style={s.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.bar, i <= step && s.barOn]} />
            ))}
          </View>
          <Text style={s.stepText}>{step}/3</Text>
        </View>

        {step === 1 && (
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>何を占いますか</Text>
            <Text style={s.sub}>ジャンルを選んでください</Text>
            <View style={s.grid}>
              {(Object.entries(GENRE_INFO) as [Genre, typeof GENRE_INFO[Genre]][]).map(([key, g]) => {
                const on = genre === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setGenre(key)}
                    style={[s.gCard, on && s.gCardOn]}
                  accessibilityRole="button">
                    <Text style={[s.gIcon, on && s.gIconOn]}>{g.icon}</Text>
                    <Text style={[s.gLabel, on && s.gLabelOn]}>{g.label}</Text>
                    <Text style={[s.gSub, on && s.gSubOn]}>{g.sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {step === 2 && genre && (
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>名前と詳細</Text>
            <Text style={s.sub}>{GENRE_INFO[genre].label}を登録します</Text>

            <Text style={s.fieldLabel}>名前</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="例: たくみ"
              placeholderTextColor="rgba(255,255,255,0.4)"
            />

            <Text style={s.fieldLabel}>関係・カテゴリ</Text>
            <View style={s.subRow}>
              {SUB_LABELS[genre].map((l) => {
                const on = label === l;
                return (
                  <Pressable key={l} onPress={() => setLabel(l)} style={[s.chip, on && s.chipOn]} accessibilityRole="button">
                    <Text style={[s.chipText, on && s.chipTextOn]}>{l}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={s.fieldLabel}>生年月日</Text>
            <NumWheel
              label="年"
              values={Array.from({ length: new Date().getFullYear() + 1 - 1900 + 1 }, (_, i) => 1900 + i)}
              value={year}
              onChange={setYear}
            />
            <NumWheel
              label="月"
              values={Array.from({ length: 12 }, (_, i) => i + 1)}
              value={month}
              onChange={setMonth}
            />
            <NumWheel
              label="日"
              values={Array.from({ length: dayMax }, (_, i) => i + 1)}
              value={day}
              onChange={setDay}
            />
          </ScrollView>
        )}

        {(step === 1 || step === 2) && (
          <Pressable
            style={[s.cta, (step === 1 && !genre) || (step === 2 && (!name || !label)) ? { opacity: 0.5 } : null]}
            onPress={() => {
              if (step === 1 && genre) setStep(2);
              else if (step === 2 && name && label) onSave();
            }}
            disabled={(step === 1 && !genre) || (step === 2 && (!name || !label))}
          accessibilityRole="button">
            <Text style={s.ctaText}>{step === 2 ? "登録する" : "次へ"}</Text>
          </Pressable>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/**
 * 横スクロール型の数値ホイール。
 * +/- ボタンと違って大きな数値（例: 1995年 → 2010年）も少ないタップで届く。
 */
function NumWheel({ label, values, value, onChange }: {
  label: string; values: number[]; value: number; onChange: (v: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const CELL_W = 60;
  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ x: Math.max(0, idx * CELL_W - 100), animated: false });
    }
  }, [value, values]);
  return (
    <View style={s.wheel}>
      <Text style={s.wheelLabel}>{label}</Text>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
        {values.map((v) => (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[s.wheelCell, v === value && s.wheelCellOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: v === value }}
          >
            <Text style={[s.wheelText, v === value && s.wheelTextOn]}>{v}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 24 },
  back: { color: C.white, fontSize: 22, paddingHorizontal: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" },
  barOn: { backgroundColor: "rgba(255,255,255,0.95)" },
  stepText: { color: C.white, fontSize: 10, opacity: 0.85 },

  body: { paddingBottom: 24 },
  title: { color: C.white, fontSize: 22, lineHeight: 36, fontWeight: "500", fontFamily: F.serif },
  sub: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 12, lineHeight: 22, fontFamily: F.serif },

  grid: { marginTop: 22, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gCard: { width: "48%", padding: 14, alignItems: "center", borderRadius: 14, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder },
  gCardOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  gIcon: { color: C.white, fontSize: 22, marginBottom: 6 },
  gIconOn: { color: C.red },
  gLabel: { color: C.white, fontSize: 12, fontWeight: "600" },
  gLabelOn: { color: C.ink },
  gSub: { color: C.white, fontSize: 9, opacity: 0.85, marginTop: 3 },
  gSubOn: { color: C.inkSub, opacity: 1 },

  fieldLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: C.white15, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.white, fontSize: 16, borderWidth: 1, borderColor: C.whiteBorder, fontFamily: F.serif },
  subRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder },
  chipOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  chipText: { color: C.white, fontSize: 12, fontFamily: F.serif },
  chipTextOn: { color: C.red, fontWeight: "600" },

  wheel: { flexDirection: "row", alignItems: "center", backgroundColor: C.white15, borderRadius: 10, borderWidth: 1, borderColor: C.whiteBorder, marginBottom: 8, paddingVertical: 6 },
  wheelLabel: { color: C.white, fontSize: 11, opacity: 0.7, paddingHorizontal: 12, width: 36 },
  wheelCell: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 56, alignItems: "center" },
  wheelCellOn: { backgroundColor: C.white95 },
  wheelText: { color: C.white, fontSize: 16, fontFamily: F.serif },
  wheelTextOn: { color: C.red, fontWeight: "600" },

  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold, marginBottom: 8 },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 6, fontFamily: F.serif },
});
