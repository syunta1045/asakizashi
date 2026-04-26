import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSubscription, isTrialActive, trialDaysRemaining } from "../lib/subscription";
import { restorePurchases, isRevenueCatConfigured, getOfferings, purchasePackage } from "../lib/revenuecat";
import { haptics } from "../lib/haptics";
import { C, dawnGradient, F } from "../lib/theme";

const FEATURES: { f: string; free: string | boolean; prem: string | boolean }[] = [
  { f: "毎朝の一行メッセージ", free: true, prem: true },
  { f: "中吉などの吉凶判定", free: true, prem: true },
  { f: "ラッキー要素", free: "3つ", prem: "6つ" },
  { f: "命式の詳細（年・月・日柱）", free: false, prem: true },
  { f: "五行バランス", free: false, prem: true },
  { f: "月の流れ・節目の日", free: false, prem: true },
  { f: "つながりの登録", free: "5件", prem: "無制限" },
  { f: "通知時刻のカスタム", free: false, prem: true },
  { f: "詳細鑑定書PDF", free: false, prem: "月1回" },
];

export default function Premium() {
  const router = useRouter();
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");
  const sub = useSubscription();
  const onTrial = isTrialActive(sub);
  const daysLeft = trialDaysRemaining(sub);

  const onStartTrial = async () => {
    if (sub.isPremium) {
      Alert.alert("ご利用中です", onTrial ? `トライアル残り ${daysLeft} 日` : "プレミアムをご利用中です");
      return;
    }

    // RevenueCat が構成済みなら本物の購入フロー、未構成ならローカル体験版に分岐。
    // 「7日後に自動課金」という誤解を生む文言は、課金パイプライン未開通の状態では出さない。
    if (isRevenueCatConfigured) {
      const offerings = (await getOfferings()) as { current?: { availablePackages?: unknown[] } } | null;
      const target = offerings?.current?.availablePackages?.find?.((p: any) =>
        plan === "yearly" ? /year/i.test(p?.identifier ?? "") : /month/i.test(p?.identifier ?? "")
      );
      if (!target) {
        Alert.alert("商品を取得できませんでした", "通信環境を確認してもう一度お試しください。");
        return;
      }
      Alert.alert(
        plan === "yearly" ? "年額プランを購入" : "月額プランを購入",
        "7日間の無料トライアル後、選択したプランで自動課金が開始されます。設定からいつでも解約できます。",
        [
          { text: "キャンセル", style: "cancel" },
          { text: "購入", onPress: async () => {
              const r = await purchasePackage(target);
              if (!r.ok) {
                Alert.alert("購入できませんでした", r.error || "もう一度お試しください。");
                return;
              }
              haptics.success();
              sub.setPlan(plan === "yearly" ? "premium_yearly" : "premium_monthly");
              Alert.alert("ありがとうございます", "プレミアム機能がご利用いただけます。");
              router.back();
            } },
        ]
      );
      return;
    }

    // 課金パイプライン未開通 → ローカル7日間お試し（自動課金は走らない）
    Alert.alert(
      "7日間 無料でお試し",
      "プレミアム機能を7日間ご利用いただけます。期間終了後は自動で無料プランに戻り、課金は発生しません。\n（正式な購入機能は順次提供予定です）",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "始める", onPress: () => {
            haptics.success();
            sub.startTrial();
            Alert.alert("ようこそ", "プレミアム機能がご利用いただけます。");
            router.back();
          } },
      ]
    );
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        <Pressable
          onPress={() => router.back()}
          style={s.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="閉じる"
          hitSlop={12}
        >
          <Text style={s.close}>✕</Text>
        </Pressable>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.intro}>
            <Text style={s.brandLabel}>── 旭兆 プレミアム ──</Text>
            <Text style={s.headline}>もう一段、深く{"\n"}読み解く</Text>
            <Text style={s.lede}>
              四柱推命の本格的な精度で{"\n"}毎朝のお告げを、もっと丁寧に。
            </Text>
          </View>

          {/* プラン切替 */}
          <View style={s.planRow}>
            <Pressable
              onPress={() => setPlan("yearly")}
              style={[s.planChip, plan === "yearly" && s.planChipOn]}
            accessibilityRole="button">
              <Text style={[s.planChipText, plan === "yearly" && s.planChipTextOn]}>年額 ¥3,800</Text>
              {plan === "yearly" && <Text style={s.planSale}>33%OFF</Text>}
            </Pressable>
            <Pressable
              onPress={() => setPlan("monthly")}
              style={[s.planChip, plan === "monthly" && s.planChipOn]}
            accessibilityRole="button">
              <Text style={[s.planChipText, plan === "monthly" && s.planChipTextOn]}>月額 ¥480</Text>
            </Pressable>
          </View>

          {/* 比較表 */}
          <View style={s.table}>
            <View style={s.tableRow}>
              <Text style={s.tableHeadCol} />
              <Text style={s.tableHead}>FREE</Text>
              <Text style={[s.tableHead, { color: C.red }]}>PREMIUM</Text>
            </View>
            {FEATURES.map((row, i) => (
              <View key={i} style={[s.tableRow, { borderTopWidth: 1, borderTopColor: C.paperBorder }]}>
                <Text style={s.tableCol}>{row.f}</Text>
                <Text style={[s.tableCell, { color: typeof row.free === "boolean" ? (row.free ? C.gold : C.inkMuted) : C.gold }]}>
                  {typeof row.free === "boolean" ? (row.free ? "○" : "—") : row.free}
                </Text>
                <Text style={[s.tableCell, { color: C.red, fontWeight: "600" }]}>
                  {typeof row.prem === "boolean" ? (row.prem ? "○" : "—") : row.prem}
                </Text>
              </View>
            ))}
          </View>

          <Pressable style={s.cta} onPress={onStartTrial} accessibilityRole="button">
            <Text style={s.ctaText}>
              {sub.isPremium ? (onTrial ? `トライアル残り ${daysLeft} 日` : "ご利用中") : "7日間無料で試す"}
            </Text>
          </Pressable>

          <Pressable
            style={s.restore}
            onPress={async () => {
              haptics.light();
              if (!isRevenueCatConfigured) {
                Alert.alert("購入を復元", "課金情報を確認しています...");
                return;
              }
              const result = await restorePurchases();
              if (result.isPremium) {
                sub.setPlan("premium_monthly");
                Alert.alert("復元しました", "プレミアム機能がご利用いただけます。");
              } else {
                Alert.alert("購入が見つかりませんでした", "Apple ID / Google アカウントを確認してください。");
              }
            }}
          accessibilityRole="button">
            <Text style={s.restoreText}>購入を復元</Text>
          </Pressable>

          <Text style={s.legal}>
            いつでも解約できます（解約は{Platform.OS === "ios" ? "App Store" : "Google Play"}の設定から）{"\n"}
            {plan === "yearly" ? "年額 ¥3,800（月あたり ¥316）" : "月額 ¥480"}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  closeBtn: { padding: 16, alignSelf: "flex-end" },
  close: { color: C.white, fontSize: 18 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },

  intro: { alignItems: "center", paddingHorizontal: 8 },
  brandLabel: { color: C.paper, fontSize: 10, opacity: 0.85, letterSpacing: 6, fontFamily: F.serif },
  headline: { color: C.white, fontSize: 24, fontWeight: "500", lineHeight: 36, marginTop: 14, textAlign: "center", fontFamily: F.serif },
  lede: { color: C.white, fontSize: 12, opacity: 0.85, lineHeight: 22, marginTop: 12, textAlign: "center", fontFamily: F.serif },

  planRow: { flexDirection: "row", marginTop: 24, padding: 4, backgroundColor: C.white12, borderRadius: 30, borderWidth: 1, borderColor: C.whiteBorder },
  planChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 26 },
  planChipOn: { backgroundColor: C.white95 },
  planChipText: { color: C.white, fontSize: 12, fontWeight: "500" },
  planChipTextOn: { color: C.ink, fontWeight: "600" },
  planSale: { color: C.red, fontSize: 9, fontWeight: "700", marginTop: 2 },

  table: { marginTop: 20, backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14 },
  tableCol: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "500" },
  tableHeadCol: { flex: 1 },
  tableCell: { width: 70, textAlign: "center", fontSize: 11 },
  tableHead: { width: 70, textAlign: "center", fontSize: 9, color: C.inkSub, fontWeight: "600", letterSpacing: 1 },

  cta: { marginTop: 20, padding: 16, backgroundColor: C.white, borderRadius: 30, alignItems: "center", borderWidth: 1, borderColor: C.gold },
  ctaText: { color: C.ink, fontSize: 14, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
  restore: { marginTop: 8, padding: 12, alignItems: "center" },
  restoreText: { color: C.white, fontSize: 12, opacity: 0.85, textDecorationLine: "underline", fontFamily: F.serif },
  legal: { color: C.white, fontSize: 10, opacity: 0.8, textAlign: "center", marginTop: 10, lineHeight: 18 },
});
