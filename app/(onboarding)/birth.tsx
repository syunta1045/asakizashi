import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { PlaceSelectButton, PlacePickerModal } from "../../components/PlacePicker";
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



export default function BirthStep() {
  const router = useRouter();
  const { birthYear, birthMonth, birthDay, birthPlace, setField } = useUser();
  const [placeOpen, setPlaceOpen] = useState(false);

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
      <PlaceSelectButton value={birthPlace} onPress={() => setPlaceOpen(true)} />
      <Text style={s.hint}>日柱の境界判定に使います・海外もOK</Text>
      <PlacePickerModal
        visible={placeOpen}
        value={birthPlace}
        onPick={(v) => setField("birthPlace", v)}
        onClose={() => setPlaceOpen(false)}
      />
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
  hint: { color: C.white, fontSize: 10, opacity: 0.75, marginTop: 8 },
});
