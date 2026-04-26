import { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser } from "../../lib/store";
import { C, F } from "../../lib/theme";

const CELL_WIDTH = 60; // wheelCell minWidth + gap

function NumWheel({ values, value, onChange, unit }: {
  values: number[]; value: number; onChange: (v: number) => void; unit: string;
}) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    const idx = values.indexOf(value);
    if (idx >= 0 && ref.current) {
      // 選択値を中央付近に
      ref.current.scrollTo({ x: Math.max(0, idx * CELL_WIDTH - 100), animated: false });
    }
  }, [value, values]);
  return (
    <View style={s.wheel}>
      <Text style={s.wheelLabel}>{unit}</Text>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}>
        {values.map((v) => (
          <Pressable key={v} onPress={() => onChange(v)} style={[s.wheelCell, v === value && s.wheelCellOn]} accessibilityRole="button">
            <Text style={[s.wheelText, v === value && s.wheelTextOn]}>{v}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const PLACES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県",
  "岐阜県","静岡県","愛知県","三重県",
  "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
  "鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
  "海外",
];


export default function BirthStep() {
  const router = useRouter();
  const { birthYear, birthMonth, birthDay, birthPlace, setField } = useUser();

  const today = new Date();
  const isFuture = new Date(birthYear, birthMonth - 1, birthDay) > today;

  const currentYear = today.getFullYear();
  const years = Array.from({ length: currentYear - 1929 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const dayMax = new Date(birthYear, birthMonth, 0).getDate();
  const days = Array.from({ length: dayMax }, (_, i) => i + 1);

  // 月・年が変わって birthDay が新しい dayMax を超えていたら自動クランプ
  useEffect(() => {
    if (birthDay > dayMax) setField("birthDay", dayMax);
  }, [birthYear, birthMonth, dayMax]);

  return (
    <OnboardShell
      step={2}
      title={"生まれた日を\n教えてください"}
      sub="あなたの命式（めいしき）を読み解きます"
      onNext={() => router.push("/(onboarding)/mbti")}
      disabled={isFuture}
    >
      <Text style={s.section}>生年月日</Text>
      <NumWheel values={years} value={birthYear} unit="年" onChange={(v) => setField("birthYear", v)} />
      <NumWheel values={months} value={birthMonth} unit="月" onChange={(v) => setField("birthMonth", v)} />
      <NumWheel values={days} value={Math.min(birthDay, dayMax)} unit="日" onChange={(v) => setField("birthDay", v)} />

      <Text style={[s.section, { marginTop: 18 }]}>生まれた場所</Text>
      <View style={s.placeRow}>
        {PLACES.map((p) => (
          <Pressable
            key={p}
            onPress={() => setField("birthPlace", p)}
            style={[s.chip, birthPlace === p && s.chipActive]}
          accessibilityRole="button">
            <Text style={[s.chipText, birthPlace === p && s.chipTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.hint}>日柱の境界判定に使います・海外もOK</Text>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  section: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  wheel: { flexDirection: "row", alignItems: "center", backgroundColor: C.white15, borderRadius: 10, borderWidth: 1, borderColor: C.whiteBorder, marginBottom: 8, paddingVertical: 6 },
  wheelLabel: { color: C.white, fontSize: 11, opacity: 0.7, paddingHorizontal: 12, width: 36 },
  wheelCell: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 56, alignItems: "center" },
  wheelCellOn: { backgroundColor: C.white95 },
  wheelText: { color: C.white, fontSize: 16, fontFamily: F.serif },
  wheelTextOn: { color: C.red, fontWeight: "600" },
  placeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder },
  chipActive: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  chipText: { color: C.white, fontSize: 12, fontFamily: F.serif },
  chipTextActive: { color: C.red, fontWeight: "600" },
  hint: { color: C.white, fontSize: 10, opacity: 0.75, marginTop: 8 },
});
