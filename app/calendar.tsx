import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUser } from "../lib/store";
import { useSubscription, isLocked } from "../lib/subscription";
import { buildMonth, nextKeyDays, type CalendarDay } from "../lib/calendar";
import { haptics } from "../lib/haptics";
import { PremiumLock } from "../components/PremiumLock";
import { C, dawnGradient, F } from "../lib/theme";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export default function Calendar() {
  const router = useRouter();
  const { pillars } = useUser();
  const { isPremium } = useSubscription();
  const now = new Date();

  // === Hooks は条件分岐より上にすべて配置（Hook順違反を回避） ===
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const { year, month } = cursor;
  const userBranch = pillars?.day.branch ?? null;
  const days = useMemo(
    () => userBranch ? buildMonth(year, month, userBranch, now) : [],
    [year, month, userBranch]
  );

  // === 条件分岐 return（hooks の後） ===
  if (!pillars || !userBranch) {
    return (
      <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
        <SafeAreaView style={s.safe} edges={["top"]}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.dateLabel}>月のメモ</Text>
              <Text style={s.title}>月間カレンダー</Text>
            </View>
          </View>
          <View style={{ padding: 24, alignItems: "center", marginTop: 40 }}>
            <Text style={{ color: C.white, fontSize: 16, lineHeight: 26, textAlign: "center", fontWeight: "600", marginBottom: 12 }}>
              生年月日を入力すると{"\n"}月間カレンダーが見られます
            </Text>
            <Text style={{ color: C.white, opacity: 0.85, fontSize: 12, lineHeight: 20, textAlign: "center", marginBottom: 24 }}>
              生年月日は任意です。未入力でも朝メモ・振り返り・つながりは使えます。
            </Text>
            <Pressable
              onPress={() => router.push("/edit/birth")}
              style={{ backgroundColor: C.paper, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, borderWidth: 1, borderColor: C.gold }}
              accessibilityRole="button"
            >
              <Text style={{ color: C.ink, fontSize: 13, fontWeight: "700", letterSpacing: 2 }}>生年月日を入力する</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (isLocked("monthCalendar", isPremium)) {
    return (
      <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
        <SafeAreaView style={s.safe} edges={["top"]}>
          <View style={s.header}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={s.dateLabel}>月のメモ</Text>
              <Text style={s.title}>月間カレンダー</Text>
            </View>
          </View>
          <PremiumLock
            title="月間カレンダーはプレミアム限定"
            description="今月の意識したい日と、過ごしやすい日が一目でわかります"
          />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const startDate = isCurrentMonth ? now.getDate() : 1;
  const keyDays = nextKeyDays(days, startDate, 3);

  // カレンダーの先頭空白
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells = [...Array(firstWeekday).fill(null), ...days];

  const goPrev = () => {
    haptics.select();
    setCursor((c) => c.month === 1 ? { year: c.year - 1, month: 12 } : { year: c.year, month: c.month - 1 });
  };
  const goNext = () => {
    haptics.select();
    setCursor((c) => c.month === 12 ? { year: c.year + 1, month: 1 } : { year: c.year, month: c.month + 1 });
  };
  const goToday = () => {
    haptics.light();
    setCursor({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };
  const onTapDay = (d: CalendarDay) => {
    haptics.select();
    setSelected(d);
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>{year}年</Text>
            <Text style={s.title}>{month}月カレンダー</Text>
          </View>
          {!isCurrentMonth && (
            <Pressable onPress={goToday} accessibilityRole="button">
              <Text style={s.todayBtn}>今月</Text>
            </Pressable>
          )}
        </View>

        <View style={s.navRow}>
          <Pressable onPress={goPrev} style={s.navBtn} accessibilityRole="button"><Text style={s.navText}>‹ 前月</Text></Pressable>
          <Pressable onPress={goNext} style={s.navBtn} accessibilityRole="button"><Text style={s.navText}>次月 ›</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* カレンダー */}
          <View style={s.calCard}>
            <View style={s.weekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={s.weekText}>{w}</Text>
              ))}
            </View>
            <View style={s.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={`b-${i}`} style={s.cell} />;
                return (
                  <Pressable key={d.date} style={s.cell} onPress={() => onTapDay(d)} accessibilityRole="button">
                    <View style={[
                      s.dayCircle,
                      d.isToday && s.dayToday,
                      d.isKey && !d.isToday && s.dayKey,
                      d.isCaution && !d.isToday && s.dayCaution,
                    ]}>
                      <Text style={[
                        s.dayText,
                        d.isToday && s.dayTextOn,
                      ]}>{d.date}</Text>
                    </View>
                    <View style={s.dot}>
                      {d.isKey && <Text style={s.dotKey}>●</Text>}
                      {d.isSoft && !d.isKey && <Text style={s.dotSoft}>○</Text>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.legend}>
              <Text style={s.legendItem}>● 意識したい日</Text>
              <Text style={s.legendItem}>○ 整えやすい日</Text>
              <Text style={[s.legendItem, { color: C.red }]}>■ 今日</Text>
            </View>
          </View>

          {/* 気になる日のリスト */}
          <Text style={s.sectionTitle}>今月の気になる日</Text>
          {keyDays.length === 0 && (
            <View style={s.emptyBox}>
              <Text style={s.empty}>今月、この先の気になる日はありません</Text>
              <Text style={s.emptySub}>気になる日は月によって変わります。翌月もチェックしてみてください。</Text>
            </View>
          )}
          {keyDays.map((d) => (
            <View key={d.date} style={s.keyCard}>
              <View style={[s.keyIcon, d.isKey ? { backgroundColor: C.red } : { backgroundColor: C.gold }]}>
              <Text style={s.keyIconText}>{d.date}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.keyType, { color: d.isKey ? C.red : C.gold }]}>
                  {d.isKey ? "◆ 意識したい日" : "○ 整えやすい日"}
                </Text>
                <Text style={s.keyDate}>{month}月{d.date}日</Text>
                <Text style={s.keyNote}>{d.isKey ? "予定を詰めすぎず、朝の一手を丁寧に。" : "小さな用事を進めやすい日です。"}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 日付プレビューモーダル */}
        <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
          <Pressable style={s.modalBg} onPress={() => setSelected(null)} accessibilityRole="button">
            {selected && (
              <View style={s.modalCard}>
                <Text style={s.modalDate}>
                  {year}年 {month}月{selected.date}日
                </Text>
                <Text style={s.modalPillar}>
                  {selected.isKey ? "意識したい日" : selected.isSoft ? "整えやすい日" : "通常の日"}
                </Text>
                <Text style={s.modalNote}>
                  今日の予定を見直すための小さなメモです。
                </Text>
                <Text style={s.modalKind}>
                  {selected.isToday   ? "■ 今日"
                  : selected.isKey    ? "● あなたにとって意識したい日"
                  : selected.isSoft   ? "○ 整えやすい日"
                  : selected.isCaution? "△ 控えめに過ごす日"
                  :                     "穏やかな一日"}
                </Text>
              </View>
            )}
          </Pressable>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 14 },
  back: { color: C.white, fontSize: 22 },
  todayBtn: { color: C.white, fontSize: 11, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: C.whiteBorder, fontFamily: F.serif },
  navRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  navText: { color: C.white, fontSize: 12, opacity: 0.85, fontFamily: F.serif },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 3 },
  title: { color: C.white, fontSize: 22, fontWeight: "500", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 16, paddingBottom: 60 },

  calCard: { backgroundColor: C.paper, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: C.paperBorder },
  weekRow: { flexDirection: "row", marginBottom: 4 },
  weekText: { flex: 1, textAlign: "center", color: C.gold, fontSize: 10, paddingVertical: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center", padding: 2 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  dayToday: { backgroundColor: C.red },
  dayKey: { backgroundColor: "rgba(158,47,47,0.08)" },
  dayCaution: { borderWidth: 1, borderColor: C.warn },
  dayText: { color: C.ink, fontSize: 12, fontFamily: F.serif },
  dayTextOn: { color: C.white, fontWeight: "600" },
  dot: { height: 6, justifyContent: "center" },
  dotKey: { fontSize: 6, color: C.red },
  dotSoft: { fontSize: 6, color: C.gold },
  legend: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 8 },
  legendItem: { fontSize: 9, color: C.inkSub },

  sectionTitle: { color: C.white, fontSize: 13, fontWeight: "500", letterSpacing: 3, marginTop: 24, marginBottom: 12, fontFamily: F.serif },
  empty: { color: C.white, fontSize: 13, fontFamily: F.serif, textAlign: "center" },
  emptyBox: { padding: 20, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginTop: 8, gap: 6 },
  emptySub: { color: C.white, opacity: 0.75, fontSize: 11, lineHeight: 18, textAlign: "center", fontFamily: F.serif },
  keyCard: { flexDirection: "row", gap: 12, alignItems: "center", padding: 14, backgroundColor: C.white95, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, marginBottom: 8 },
  keyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  keyIconText: { color: C.white, fontSize: 16, fontWeight: "500", fontFamily: F.serif },
  keyType: { fontSize: 9, letterSpacing: 2, fontWeight: "600" },
  keyDate: { color: C.ink, fontSize: 13, fontWeight: "600", marginTop: 2, fontFamily: F.serif },
  keyNote: { color: C.inkSub, fontSize: 10, marginTop: 2, fontFamily: F.serif },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: 28 },
  modalCard: { backgroundColor: C.paper, borderRadius: 18, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.paperBorder, minWidth: 240 },
  modalDate: { color: C.gold, fontSize: 11, letterSpacing: 2, fontFamily: F.serif },
  modalPillar: { color: C.red, fontSize: 36, fontWeight: "600", letterSpacing: 4, marginTop: 14, fontFamily: F.serif },
  modalNote: { color: C.inkSub, fontSize: 11, marginTop: 6, letterSpacing: 2, fontFamily: F.serif },
  modalKind: { color: C.ink, fontSize: 13, marginTop: 16, fontFamily: F.serif },
});
