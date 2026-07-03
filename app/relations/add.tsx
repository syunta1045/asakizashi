import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, StyleSheet, Keyboard } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useRelations, ACTIVE_GENRES, GENRE_INFO, RelationLimitError, FREE_RELATION_LIMIT, type Genre } from "../../lib/relations";
import { useSubscription } from "../../lib/subscription";
import { C, dawnGradient, F } from "../../lib/theme";

export default function AddRelation() {
  const router = useRouter();
  const { add } = useRelations();
  const isPremium = useSubscription((s) => s.isPremium);
  const [step, setStep] = useState<1 | 2>(1);
  const [genre, setGenre] = useState<Genre | null>(null);
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
    if (!genre) return;
    Keyboard.dismiss();
    try {
      add({
        genre, label: GENRE_INFO[genre].label,
        name, birthYear: year, birthMonth: month, birthDay: day,
      }, isPremium);
      router.replace("/(tabs)/relations");
    } catch (e) {
      if (e instanceof RelationLimitError) {
        Alert.alert(
          "登録上限に達しました",
          `通常プランでは${FREE_RELATION_LIMIT}件まで登録できます。プレミアムをはじめると無制限になります。`,
          [
            { text: "キャンセル", style: "cancel" },
            { text: "プレミアムを見る", onPress: () => router.replace("/premium?source=relations_limit") },
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
        <View style={s.headerRow}>
          <Pressable onPress={() => step === 1 ? router.back() : setStep(1)} accessibilityRole="button">
            <Text style={s.back}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, flexDirection: "row", gap: 6 }}>
            {[1, 2].map((i) => (
              <View key={i} style={[s.bar, i <= step && s.barOn]} />
            ))}
          </View>
          <Text style={s.stepText}>{step}/2</Text>
        </View>

        {step === 1 && (
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>何を登録しますか</Text>
            <Text style={s.sub}>あとから削除できます</Text>
            <View style={s.grid}>
              {ACTIVE_GENRES.map((key) => {
                const g = GENRE_INFO[key];
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
            <Text style={s.title}>名前と生年月日</Text>
            <Text style={s.sub}>{GENRE_INFO[genre].label}を登録します</Text>

            <Text style={s.fieldLabel}>名前</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="例: たくみ"
              placeholderTextColor="rgba(255,255,255,0.4)"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <Text style={s.fieldLabel}>生年月日</Text>
            <NumWheel
              label="年"
              values={Array.from({ length: new Date().getFullYear() - 1900 + 1 }, (_, i) => 1900 + i)}
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
            style={[s.cta, (step === 1 && !genre) || (step === 2 && !name.trim()) ? { opacity: 0.5 } : null]}
            onPress={() => {
              if (step === 1 && genre) setStep(2);
              else if (step === 2 && name.trim()) onSave();
            }}
            disabled={(step === 1 && !genre) || (step === 2 && !name.trim())}
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
  const ITEM_W = 64;
  const ITEM_GAP = 4;
  const scrollToValue = () => {
    const idx = values.indexOf(value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ x: Math.max(0, idx * (ITEM_W + ITEM_GAP) - 120), animated: false });
    }
  };
  useEffect(() => {
    scrollToValue();
  }, [value]);
  return (
    <View style={s.wheel}>
      <Text style={s.wheelLabel}>{label}</Text>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: ITEM_GAP }}
        onContentSizeChange={scrollToValue}
      >
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
  safe: { flex: 1, paddingHorizontal: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 18 },
  back: { color: C.white, fontSize: 22, paddingHorizontal: 4 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)" },
  barOn: { backgroundColor: "rgba(255,255,255,0.95)" },
  stepText: { color: C.white, fontSize: 10, opacity: 0.85 },

  body: { paddingBottom: 18 },
  title: { color: C.white, fontSize: 22, lineHeight: 32, fontWeight: "500", fontFamily: F.serif },
  sub: { color: C.white, fontSize: 12, opacity: 0.85, marginTop: 8, lineHeight: 20, fontFamily: F.serif },

  grid: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  gCard: { width: "48%", minHeight: 82, padding: 12, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder },
  gCardOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  gIcon: { color: C.white, fontSize: 22, marginBottom: 6 },
  gIconOn: { color: C.red },
  gLabel: { color: C.white, fontSize: 12, fontWeight: "600" },
  gLabelOn: { color: C.ink },
  gSub: { color: C.white, fontSize: 9, opacity: 0.85, marginTop: 3, textAlign: "center", lineHeight: 13 },
  gSubOn: { color: C.inkSub, opacity: 1 },

  fieldLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: C.white15, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C.white, fontSize: 16, borderWidth: 1, borderColor: C.whiteBorder, fontFamily: F.serif },
  wheel: { flexDirection: "row", alignItems: "center", backgroundColor: C.white15, borderRadius: 10, borderWidth: 1, borderColor: C.whiteBorder, marginBottom: 8, paddingVertical: 6 },
  wheelLabel: { color: C.white, fontSize: 11, opacity: 0.7, paddingHorizontal: 12, width: 36 },
  wheelCell: { width: 64, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  wheelCellOn: { backgroundColor: C.white95 },
  wheelText: { color: C.white, fontSize: 16, fontFamily: F.serif },
  wheelTextOn: { color: C.red, fontWeight: "600" },

  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: C.gold, marginBottom: 8 },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 2, fontFamily: F.serif },
});
