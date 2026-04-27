/**
 * 都道府県セレクター
 * 47都道府県 + 海外を地方別グループで一画面に展開する Modal ピッカー。
 * オンボーディング (birth.tsx) と 設定編集 (edit/[field].tsx) で共通利用。
 */
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from "react-native";
import { C, F } from "../lib/theme";

export const PLACE_GROUPS: ReadonlyArray<{ region: string; places: readonly string[] }> = [
  { region: "北海道・東北", places: ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県"] },
  { region: "関東",         places: ["茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県"] },
  { region: "中部",         places: ["新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県"] },
  { region: "近畿",         places: ["三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"] },
  { region: "中国",         places: ["鳥取県","島根県","岡山県","広島県","山口県"] },
  { region: "四国",         places: ["徳島県","香川県","愛媛県","高知県"] },
  { region: "九州・沖縄",   places: ["福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"] },
  { region: "その他",       places: ["海外"] },
];

export const ALL_PLACES: string[] = PLACE_GROUPS.flatMap((g) => [...g.places]);

/** 1段の選択ボタン。タップするとモーダルが開く */
export function PlaceSelectButton({ value, onPress }: { value: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={s.button}
      accessibilityRole="button"
      accessibilityLabel={`生まれた場所を選ぶ。現在: ${value || "未選択"}`}
    >
      <Text style={s.buttonValue}>{value || "選んでください"}</Text>
      <Text style={s.buttonArrow}>›</Text>
    </Pressable>
  );
}

export function PlacePickerModal({ visible, value, onPick, onClose }: {
  visible: boolean;
  value: string;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalBg}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>生まれた場所を選ぶ</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="閉じる"
            >
              <Text style={s.modalClose}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
            {PLACE_GROUPS.map((g) => (
              <View key={g.region} style={s.groupBlock}>
                <Text style={s.groupLabel}>{g.region}</Text>
                <View style={s.groupGrid}>
                  {g.places.map((p) => {
                    const on = value === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => { onPick(p); onClose(); }}
                        style={[s.chip, on && s.chipOn]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.whiteBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonValue: { color: C.white, fontSize: 15, fontFamily: F.serif },
  buttonArrow: { color: C.white, fontSize: 20, opacity: 0.7 },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "85%", paddingTop: 8 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  modalTitle: { color: C.ink, fontSize: 15, fontWeight: "600", fontFamily: F.serif },
  modalClose: { color: C.ink, fontSize: 26, paddingHorizontal: 4 },
  modalBody: { padding: 16, paddingBottom: 32 },
  groupBlock: { marginBottom: 18 },
  groupLabel: { color: C.gold, fontSize: 11, fontWeight: "600", letterSpacing: 2, marginBottom: 8 },
  groupGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: "rgba(184,150,86,0.12)", borderWidth: 1, borderColor: C.paperBorder },
  chipOn: { backgroundColor: C.red, borderColor: C.red },
  chipText: { color: C.ink, fontSize: 13, fontFamily: F.serif },
  chipTextOn: { color: C.white, fontWeight: "600" },
});
