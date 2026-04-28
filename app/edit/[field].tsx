import { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser, notifyTimeFrom } from "../../lib/store";
import { scheduleMorningNotification } from "../../lib/notifications";
import { PlaceSelectButton, PlacePickerModal } from "../../components/PlacePicker";
import { C, dawnGradient, F } from "../../lib/theme";

const MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
type BloodVal = "A" | "B" | "O" | "AB" | "unknown";
type GenderVal = "female" | "male" | "other" | "none";

const BLOODS: { v: BloodVal; label: string }[] = [
  { v: "A", label: "A型" }, { v: "B", label: "B型" },
  { v: "O", label: "O型" }, { v: "AB", label: "AB型" },
  { v: "unknown", label: "わからない" },
];
const GENDERS: { v: GenderVal; label: string }[] = [
  { v: "female", label: "女性" }, { v: "male", label: "男性" },
  { v: "other", label: "その他" }, { v: "none", label: "選択しない" },
];
const THEMES = [
  "恋愛・パートナーシップ","結婚・家庭","子育て・家族",
  "仕事・キャリア","副業・独立","お金・金運","勝負・運気",
  "人間関係","学び・成長","創作・表現",
  "趣味・楽しみ","旅・冒険",
  "健康・体調","メンタル・心","美容・ライフスタイル","食・暮らし",
  "推し・ファン活動","スピリチュアル",
];

export default function EditField() {
  const router = useRouter();
  const { field } = useLocalSearchParams<{ field: string }>();

  const titleMap: Record<string, string> = {
    nickname: "ニックネーム", birth: "生年月日", place: "生まれた場所",
    mbti: "MBTI", blood: "血液型", gender: "性別", wakeup: "起床時間", themes: "関心テーマ",
  };
  const title = titleMap[field || ""] || "編集";

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <Text style={s.title}>{title}を編集</Text>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {field === "nickname" && <NicknameEditor />}
          {field === "birth" && <BirthEditor />}
          {field === "place" && <PlaceEditor />}
          {field === "mbti" && <MbtiEditor />}
          {field === "blood" && <BloodEditor />}
          {field === "gender" && <GenderEditor />}
          {field === "wakeup" && <WakeUpEditor />}
          {field === "themes" && <ThemesEditor />}
        </ScrollView>

        <Pressable style={s.cta} onPress={() => router.back()} accessibilityRole="button">
          <Text style={s.ctaText}>完了</Text>
        </Pressable>
      </SafeAreaView>
    </LinearGradient>
  );
}

function NicknameEditor() {
  const { nickname, setField } = useUser();
  return (
    <TextInput
      style={s.input}
      value={nickname}
      onChangeText={(v) => setField("nickname", v)}
      placeholderTextColor="rgba(255,255,255,0.4)"
      autoFocus
    />
  );
}

function BirthEditor() {
  const u = useUser();
  const dayMax = new Date(u.birthYear, u.birthMonth, 0).getDate();
  // 月・年変更で birthDay が dayMax を超えていたらクランプ
  useEffect(() => {
    if (u.birthDay > dayMax) {
      u.setField("birthDay", dayMax);
      u.computePillars();
    }
  }, [u.birthYear, u.birthMonth, dayMax]);
  return (
    <View>
      <NumRow label="年" value={u.birthYear} setValue={(v) => { u.setField("birthYear", v); u.computePillars(); }} min={1900} max={new Date().getFullYear()} />
      <NumRow label="月" value={u.birthMonth} setValue={(v) => { u.setField("birthMonth", v); u.computePillars(); }} min={1} max={12} />
      <NumRow label="日" value={u.birthDay} setValue={(v) => { u.setField("birthDay", v); u.computePillars(); }} min={1} max={dayMax} />
      <Text style={s.note}>変更すると命式が再計算されます</Text>
    </View>
  );
}

function PlaceEditor() {
  const { birthPlace, setField } = useUser();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <PlaceSelectButton value={birthPlace} onPress={() => setOpen(true)} />
      <PlacePickerModal
        visible={open}
        value={birthPlace}
        onPick={(v) => setField("birthPlace", v)}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

function MbtiEditor() {
  const { mbti, setField } = useUser();
  return (
    <View>
      <View style={s.grid}>
        {MBTI_LIST.map((t) => (
          <Pressable key={t} onPress={() => setField("mbti", t)} style={[s.cell, mbti === t && s.cellOn]} accessibilityRole="button">
            <Text style={[s.cellText, mbti === t && s.cellTextOn]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setField("mbti", null)} style={[s.fullRow, mbti === null && s.fullRowOn]} accessibilityRole="button">
        <Text style={[s.fullRowText, mbti === null && s.fullRowTextOn]}>わからない</Text>
      </Pressable>
    </View>
  );
}

function BloodEditor() {
  const { bloodType, setField } = useUser();
  return (
    <View style={{ gap: 8 }}>
      {BLOODS.map((b) => (
        <Pressable key={b.v} onPress={() => setField("bloodType", b.v)} style={[s.fullRow, bloodType === b.v && s.fullRowOn]} accessibilityRole="button">
          <Text style={[s.fullRowText, bloodType === b.v && s.fullRowTextOn]}>{b.label}</Text>
          {bloodType === b.v && <Text style={s.checkRed}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function GenderEditor() {
  const { gender, setField } = useUser();
  return (
    <View style={{ gap: 8 }}>
      {GENDERS.map((g) => (
        <Pressable key={g.v} onPress={() => setField("gender", g.v)} style={[s.fullRow, gender === g.v && s.fullRowOn]} accessibilityRole="button">
          <Text style={[s.fullRowText, gender === g.v && s.fullRowTextOn]}>{g.label}</Text>
          {gender === g.v && <Text style={s.checkRed}>✓</Text>}
        </Pressable>
      ))}
    </View>
  );
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function WakeUpEditor() {
  const { wakeUpTime, nickname, setField } = useUser();
  const [hStr, mStr] = wakeUpTime.split(":");
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  const update = async (h: number, m: number) => {
    const t = `${pad2(h)}:${pad2(m)}`;
    setField("wakeUpTime", t);
    try { await scheduleMorningNotification(t, nickname); } catch {}
  };

  // 1分単位で自由入力可能（時 0-23、分 0-59）
  return (
    <View>
      <Text style={s.bigTime}>{wakeUpTime}</Text>
      <Text style={s.note}>通知は {notifyTimeFrom(wakeUpTime)} に届きます</Text>
      <View style={s.timePickerRow}>
        <View style={s.timePickerCol}>
          <Pressable
            onPress={() => update((hour + 1) % 24, minute)}
            style={s.timeStepBtn}
            accessibilityRole="button"
            accessibilityLabel="時を1進める"
          ><Text style={s.timeStepText}>＋</Text></Pressable>
          <Text style={s.timeValue}>{pad2(hour)}</Text>
          <Pressable
            onPress={() => update((hour + 23) % 24, minute)}
            style={s.timeStepBtn}
            accessibilityRole="button"
            accessibilityLabel="時を1戻す"
          ><Text style={s.timeStepText}>−</Text></Pressable>
          <Text style={s.timeUnit}>時</Text>
        </View>
        <Text style={s.timeSep}>:</Text>
        <View style={s.timePickerCol}>
          <Pressable
            onPress={() => update(hour, (minute + 1) % 60)}
            style={s.timeStepBtn}
            accessibilityRole="button"
            accessibilityLabel="分を1進める"
          ><Text style={s.timeStepText}>＋</Text></Pressable>
          <Text style={s.timeValue}>{pad2(minute)}</Text>
          <Pressable
            onPress={() => update(hour, (minute + 59) % 60)}
            style={s.timeStepBtn}
            accessibilityRole="button"
            accessibilityLabel="分を1戻す"
          ><Text style={s.timeStepText}>−</Text></Pressable>
          <Text style={s.timeUnit}>分</Text>
        </View>
      </View>
      <Text style={[s.note, { marginTop: 8 }]}>長押しで早送り、または下のボタンで5分単位の調整も可能です</Text>
      <View style={s.quickStepRow}>
        <Pressable
          onPress={() => {
            const total = hour * 60 + minute - 5;
            const adjusted = ((total % 1440) + 1440) % 1440;
            update(Math.floor(adjusted / 60), adjusted % 60);
          }}
          style={s.quickStepBtn}
          accessibilityRole="button"
        ><Text style={s.quickStepText}>− 5分</Text></Pressable>
        <Pressable
          onPress={() => {
            const total = hour * 60 + minute + 5;
            const adjusted = total % 1440;
            update(Math.floor(adjusted / 60), adjusted % 60);
          }}
          style={s.quickStepBtn}
          accessibilityRole="button"
        ><Text style={s.quickStepText}>+ 5分</Text></Pressable>
        <Pressable
          onPress={() => {
            const total = hour * 60 + minute + 30;
            const adjusted = total % 1440;
            update(Math.floor(adjusted / 60), adjusted % 60);
          }}
          style={s.quickStepBtn}
          accessibilityRole="button"
        ><Text style={s.quickStepText}>+ 30分</Text></Pressable>
      </View>
    </View>
  );
}

function ThemesEditor() {
  const { themes, setField } = useUser();
  const toggle = (t: string) => {
    if (themes.includes(t)) setField("themes", themes.filter((x) => x !== t));
    else if (themes.length < 3) setField("themes", [...themes, t]);
  };
  return (
    <View>
      <View style={s.chips}>
        {THEMES.map((t) => {
          const on = themes.includes(t);
          return (
            <Pressable key={t} onPress={() => toggle(t)} style={[s.chip, on && s.chipOn]} accessibilityRole="button">
              {on && <Text style={s.checkSm}>✓</Text>}
              <Text style={[s.chipText, on && s.chipTextOn]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={s.note}>{themes.length} / 3 選択中</Text>
    </View>
  );
}

function NumRow({ label, value, setValue, min, max }: { label: string; value: number; setValue: (v: number) => void; min: number; max: number }) {
  return (
    <View style={s.numRow}>
      <Text style={s.numLabel}>{label}</Text>
      <View style={s.numCtrl}>
        <Pressable onPress={() => setValue(Math.max(min, value - 1))} accessibilityRole="button"><Text style={s.numBtn}>−</Text></Pressable>
        <Text style={s.numVal}>{value}</Text>
        <Pressable onPress={() => setValue(Math.min(max, value + 1))} accessibilityRole="button"><Text style={s.numBtn}>＋</Text></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 24 },
  back: { color: C.white, fontSize: 22 },
  title: { color: C.white, fontSize: 18, fontWeight: "500", letterSpacing: 3, fontFamily: F.serif },
  content: { paddingBottom: 24, gap: 12 },

  input: { backgroundColor: C.white15, borderRadius: 12, padding: 14, color: C.white, fontSize: 18, borderWidth: 1, borderColor: C.whiteBorder, fontFamily: F.serif },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder, flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { backgroundColor: C.white95, borderColor: "rgba(255,255,255,0.5)" },
  chipText: { color: C.white, fontSize: 12, fontFamily: F.serif },
  chipTextOn: { color: C.red, fontWeight: "600" },
  checkSm: { color: C.red, fontSize: 11 },
  checkRed: { color: C.red, fontSize: 14 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cell: { width: "23.5%", paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: C.white12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  cellOn: { backgroundColor: C.white95 },
  cellText: { color: C.white, fontSize: 11, fontWeight: "600" },
  cellTextOn: { color: C.red },

  fullRow: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: C.white12, borderWidth: 1, borderColor: C.whiteBorder, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fullRowOn: { backgroundColor: C.white95 },
  fullRowText: { color: C.white, fontSize: 14, fontFamily: F.serif },
  fullRowTextOn: { color: C.ink, fontWeight: "600" },

  note: { color: C.white, fontSize: 11, opacity: 0.85, marginTop: 12, textAlign: "center" },

  numRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: C.white15, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: C.whiteBorder },
  numLabel: { color: C.white, fontSize: 13, opacity: 0.85, width: 40 },
  numCtrl: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginLeft: 14 },
  numBtn: { color: C.white, fontSize: 26, paddingHorizontal: 16 },
  numVal: { color: C.white, fontSize: 22, fontWeight: "600", fontFamily: F.serif },

  bigTime: { color: C.white, fontSize: 64, letterSpacing: 4, textAlign: "center", fontFamily: F.serif, fontWeight: "200", marginVertical: 12 },
  timePickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 16 },
  timePickerCol: { alignItems: "center", gap: 8 },
  timeStepBtn: { width: 44, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: C.white15, borderRadius: 10, borderWidth: 1, borderColor: C.whiteBorder },
  timeStepText: { color: C.white, fontSize: 22, fontWeight: "300" },
  timeValue: { color: C.white, fontSize: 36, fontFamily: F.serif, fontWeight: "300", minWidth: 60, textAlign: "center" },
  timeUnit: { color: C.white, fontSize: 11, opacity: 0.75, letterSpacing: 2, marginTop: 2 },
  timeSep: { color: C.white, fontSize: 32, fontFamily: F.serif, opacity: 0.7 },
  quickStepRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 16 },
  quickStepBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.white12, borderRadius: 18, borderWidth: 1, borderColor: C.whiteBorder },
  quickStepText: { color: C.white, fontSize: 12, fontFamily: F.serif },

  cta: { backgroundColor: C.paper, borderRadius: 30, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.gold, marginBottom: 16 },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 6, fontFamily: F.serif },
});
