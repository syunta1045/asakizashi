import { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { OnboardShell } from "../../components/OnboardShell";
import { useUser, notifyTimeFrom } from "../../lib/store";
import { C, F } from "../../lib/theme";

function pad(n: number) { return String(n).padStart(2, "0"); }
const CELL_WIDTH = 60;

function NumWheel({ values, value, onChange, unit, format = (v: number) => String(v) }: {
  values: number[]; value: number; onChange: (v: number) => void; unit: string;
  format?: (v: number) => string;
}) {
  const ref = useRef<ScrollView>(null);
  const scrollToValue = () => {
    const idx = values.indexOf(value);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ x: Math.max(0, idx * CELL_WIDTH - 100), animated: false });
    }
  };
  useEffect(() => {
    scrollToValue();
  }, [value]);
  return (
    <View style={s.wheel}>
      <Text style={s.wheelLabel}>{unit}</Text>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}
        onContentSizeChange={scrollToValue}
      >
        {values.map((v) => (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[s.wheelCell, v === value && s.wheelCellOn]}
            accessibilityRole="button"
            accessibilityLabel={`${v}${unit}`}
            accessibilityState={{ selected: v === value }}
          >
            <Text style={[s.wheelText, v === value && s.wheelTextOn]}>{format(v)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function WakeUpStep() {
  const router = useRouter();
  const { wakeUpTime, setField } = useUser();
  const [hStr, mStr] = wakeUpTime.split(":");
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  const updateTime = (h: number, m: number) => {
    setField("wakeUpTime", `${pad(h)}:${pad(m)}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 1分刻みで自由選択

  const notify = notifyTimeFrom(wakeUpTime);

  return (
    <OnboardShell
      step={2}
      total={3}
      title={"起きる時間を\n決めましょう"}
      sub="目が覚めて少し落ち着いた頃に、朝メモをお届けします"
      onNext={() => router.push("/(onboarding)/themes")}
    >
      <View style={s.clockWrap}>
        <Text style={s.clock}>{wakeUpTime}</Text>
        <Text style={s.clockLabel}>起床時刻</Text>
      </View>

      <NumWheel values={hours} value={hour} unit="時" format={pad} onChange={(h) => updateTime(h, minute)} />
      <NumWheel values={minutes} value={minute} unit="分" format={pad} onChange={(m) => updateTime(hour, m)} />

      <View style={s.notifyCard}>
        <View style={s.brandIcon}>
          <View style={s.brandCard}>
            <View style={s.brandSun} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.notifyLabel}>通知が届く時刻</Text>
          <Text style={s.notifyTime}>{notify}</Text>
        </View>
      </View>
    </OnboardShell>
  );
}

const s = StyleSheet.create({
  clockWrap: { alignItems: "center", marginVertical: 8 },
  clock: { color: C.white, fontSize: 64, letterSpacing: 4, fontFamily: F.serif, fontWeight: "200" },
  clockLabel: { color: C.white, fontSize: 11, opacity: 0.85, marginTop: 6, letterSpacing: 2 },

  wheel: { flexDirection: "row", alignItems: "center", backgroundColor: C.white15, borderRadius: 10, borderWidth: 1, borderColor: C.whiteBorder, marginTop: 8, paddingVertical: 6 },
  wheelLabel: { color: C.white, fontSize: 11, opacity: 0.7, paddingHorizontal: 12, width: 36 },
  wheelCell: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, minWidth: 56, alignItems: "center" },
  wheelCellOn: { backgroundColor: C.white95 },
  wheelText: { color: C.white, fontSize: 16, fontFamily: F.serif },
  wheelTextOn: { color: C.red, fontWeight: "600" },

  notifyCard: { marginTop: 24, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white12, borderRadius: 12, borderWidth: 1, borderColor: C.whiteBorder },
  brandIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: "rgba(250,244,224,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.whiteBorder },
  brandCard: { width: 18, height: 23, borderRadius: 5, backgroundColor: C.paper, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-3deg" }] },
  brandSun: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#F1B95F" },
  notifyLabel: { color: C.white, fontSize: 11, opacity: 0.85 },
  notifyTime: { color: C.white, fontSize: 18, fontWeight: "500", marginTop: 2 },
});
