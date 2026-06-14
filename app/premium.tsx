import { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSubscription, isTrialActive, trialDaysRemaining } from "../lib/subscription";
import { ensureRevenueCatConfigured, restorePurchases, isRevenueCatConfigured, getOfferings, purchasePackage } from "../lib/revenuecat";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

const FEATURES: { f: string; free: string | boolean; prem: string | boolean }[] = [
  { f: "朝メモ", free: true, prem: true },
  { f: "4テーマの行動ヒント", free: "一部", prem: "全テーマ" },
  { f: "持ちもの・色・場所", free: "3つ", prem: "6つ" },
  { f: "自分の傾向まとめ", free: false, prem: true },
  { f: "強み・足したいこと", free: false, prem: true },
  { f: "月間カレンダー", free: false, prem: true },
  { f: "大切な人を登録", free: "5件", prem: "無制限" },
  { f: "通知時間の調整", free: false, prem: true },
];

const DAILY_BENEFITS = [
  {
    label: "朝",
    title: "今日の動き方がすぐ決まる",
    body: "仕事・大切な人・人間関係・お金を、今日の小さな行動に分けて見られます。",
  },
  {
    label: "月",
    title: "気になる日を先に見られる",
    body: "今月の意識したい日がわかるので、予定を少し立てやすくなります。",
  },
  {
    label: "人",
    title: "大切な人への一言が見つかる",
    body: "登録した相手との距離感を見て、送る言葉をやわらかく整えられます。",
  },
];

type PlanChoice = "yearly" | "monthly";

function matchesPackagePlan(pkg: any, plan: PlanChoice): boolean {
  const text = [
    pkg?.identifier,
    pkg?.packageType,
    pkg?.product?.identifier,
    pkg?.product?.subscriptionPeriod,
  ].filter(Boolean).join(" ").toLowerCase();

  if (plan === "yearly") {
    return /(premium_yearly|year|annual|yearly|annually)/i.test(text);
  }
  return /(premium_monthly|month|monthly)/i.test(text);
}

export default function Premium() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanChoice>("yearly");
  const sub = useSubscription();
  const onTrial = isTrialActive(sub);
  const daysLeft = trialDaysRemaining(sub);
  const ctaLabel = sub.isPremium
    ? (onTrial ? `お試し残り ${daysLeft} 日` : "ご利用中")
    : plan === "yearly"
      ? "プレミアムを7日間試す"
      : "月額プランを購入";

  const onStartTrial = async () => {
    if (sub.isPremium) {
      Alert.alert("ご利用中です", onTrial ? `お試し残り ${daysLeft} 日` : "プレミアムをご利用中です");
      return;
    }

    // App Store / Google Play 審査用ビルドでは、有料機能の解放は必ずストア決済に通す。
    if (isRevenueCatConfigured) {
      const init = await ensureRevenueCatConfigured();
      if (!init.ok) {
        Alert.alert("購入の準備ができませんでした", init.error || "もう一度お試しください。");
        return;
      }
      const offerings = (await getOfferings()) as { current?: { availablePackages?: unknown[] } } | null;
      const target = offerings?.current?.availablePackages?.find?.((p: any) =>
        matchesPackagePlan(p, plan)
      );
      if (!target) {
        Alert.alert("商品を取得できませんでした", "通信環境を確認してもう一度お試しください。");
        return;
      }
      Alert.alert(
        plan === "yearly" ? "プレミアム 年額を開始" : "プレミアム 月額を購入",
        plan === "yearly"
          ? "最初の7日間は無料です。トライアル後、年額 ¥3,800 の自動更新が始まります。いつでも解約できます。"
          : "無料体験はありません。購入後すぐに月額 ¥480 の自動更新が始まります。いつでも解約できます。",
        [
          { text: "キャンセル", style: "cancel" },
          { text: "購入", onPress: async () => {
              const r = await purchasePackage(target);
              if (!r.ok) {
                Alert.alert("購入できませんでした", r.error || "もう一度お試しください。");
                return;
              }
              if (!r.isPremium) {
                Alert.alert("購入を確認できませんでした", "ストアの反映に少し時間がかかっている可能性があります。購入を復元してもう一度確認してください。");
                return;
              }
              haptics.success();
              sub.setPlan(r.plan ?? (plan === "yearly" ? "premium_yearly" : "premium_monthly"));
              Alert.alert("ありがとうございます", "プレミアム機能がご利用いただけます。");
              router.back();
            } },
        ]
      );
      return;
    }

    Alert.alert(
      "購入機能を利用できません",
      "もう一度試してみてください。改善しない場合は、ネット接続やApp Store / Google Playの購入設定をご確認ください。"
    );
  };

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
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
            <Text style={s.brandLabel}>── 朝しるべ プレミアム ──</Text>
            <Text style={s.headline}>今日を、もう少し{"\n"}自分ごとに</Text>
            <Text style={s.lede}>
              朝メモを、仕事や大切な人とのことまで、{"\n"}ぐっと身近な行動にします。
            </Text>
          </View>

          <View style={s.benefitStack}>
            {DAILY_BENEFITS.map((item) => (
              <View key={item.label} style={s.benefitCard}>
                <View style={s.benefitBadge}>
                  <Text style={s.benefitBadgeText}>{item.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.benefitTitle}>{item.title}</Text>
                  <Text style={s.benefitBody}>{item.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* プラン切替 */}
          <View style={s.planRow}>
            <Pressable
              onPress={() => setPlan("yearly")}
              style={[s.planChip, plan === "yearly" && s.planChipOn]}
            accessibilityRole="button">
              <Text style={[s.planChipText, plan === "yearly" && s.planChipTextOn]}>年額 ¥3,800</Text>
              {plan === "yearly" && <Text style={s.planSale}>33%お得</Text>}
            </Pressable>
            <Pressable
              onPress={() => setPlan("monthly")}
              style={[s.planChip, plan === "monthly" && s.planChipOn]}
            accessibilityRole="button">
              <Text style={[s.planChipText, plan === "monthly" && s.planChipTextOn]}>月額 ¥480</Text>
            </Pressable>
          </View>

          {/* 比較表 */}
          <Text style={s.tableTitle}>通常との違い</Text>
          <View style={s.table}>
            <View style={s.tableRow}>
              <Text style={s.tableHeadCol} />
              <Text style={s.tableHead}>通常</Text>
              <Text style={[s.tableHead, { color: C.red }]}>プレミアム</Text>
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

          <Text style={s.legal}>
            いつでも解約できます（解約は{Platform.OS === "ios" ? "App Store" : "Google Play"}の設定から）{"\n"}
            {plan === "yearly" ? "初回のみ7日間無料。その後、年額 ¥3,800（月あたり ¥316）" : "無料体験なし。購入後すぐに月額 ¥480"}
          </Text>
        </ScrollView>
        <View style={s.footer}>
          <Pressable
            style={[s.cta, sub.isPremium && s.ctaCurrent]}
            onPress={sub.isPremium ? undefined : onStartTrial}
            disabled={sub.isPremium}
            accessibilityRole="button"
            accessibilityState={{ disabled: sub.isPremium }}
          >
            <Text style={[s.ctaText, sub.isPremium && s.ctaTextCurrent]}>{ctaLabel}</Text>
          </Pressable>

          <Pressable
            style={s.restore}
            onPress={async () => {
              haptics.light();
              if (!isRevenueCatConfigured) {
                Alert.alert("購入を復元できませんでした", "もう一度試してみてください。改善しない場合は、ネット接続やApp Store / Google Playの購入設定をご確認ください。");
                return;
              }
              const init = await ensureRevenueCatConfigured();
              if (!init.ok) {
                Alert.alert("購入を復元できませんでした", init.error || "もう一度お試しください。");
                return;
              }
              const result = await restorePurchases();
              if (result.isPremium) {
                sub.setPlan(result.plan ?? (sub.plan === "premium_yearly" ? "premium_yearly" : "premium_monthly"));
                Alert.alert("復元しました", "プレミアム機能がご利用いただけます。");
              } else {
                Alert.alert("購入が見つかりませんでした", "Apple ID / Google アカウントを確認してください。");
              }
            }}
          accessibilityRole="button">
            <Text style={s.restoreText}>購入を復元</Text>
          </Pressable>

          <View style={s.legalLinks}>
            <Pressable onPress={() => router.push("/legal/terms")} accessibilityRole="button">
              <Text style={s.legalLinkText}>利用規約</Text>
            </Pressable>
            <Text style={s.legalLinkSep}>・</Text>
            <Pressable onPress={() => router.push("/legal/privacy")} accessibilityRole="button">
              <Text style={s.legalLinkText}>プライバシーポリシー</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  closeBtn: { padding: 16, alignSelf: "flex-end" },
  close: { color: C.white, fontSize: 18, fontWeight: "800" },
  content: { paddingHorizontal: 18, paddingBottom: 132 },

  intro: { alignItems: "center", paddingHorizontal: 8 },
  brandLabel: { color: "#FFF8EA", fontSize: 10, opacity: 0.96, letterSpacing: 6, fontFamily: F.serif, fontWeight: "800" },
  headline: { color: C.white, fontSize: 28, fontWeight: "800", lineHeight: 40, marginTop: 14, textAlign: "center", fontFamily: F.serif },
  lede: { color: C.white, fontSize: 13, opacity: 0.95, lineHeight: 24, marginTop: 12, textAlign: "center", fontFamily: F.serif, fontWeight: "600" },

  benefitStack: { gap: 8, marginTop: 24 },
  benefitCard: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#FFF8EA", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  benefitBadge: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(158,47,47,0.1)", borderWidth: 1, borderColor: "rgba(158,47,47,0.18)" },
  benefitBadgeText: { color: C.red, fontSize: 13, fontWeight: "800", fontFamily: F.serif },
  benefitTitle: { color: C.ink, fontSize: 13, fontWeight: "800" },
  benefitBody: { color: C.inkSub, fontSize: 11, lineHeight: 18, marginTop: 4, fontWeight: "600" },

  planRow: { flexDirection: "row", marginTop: 24, padding: 4, backgroundColor: "rgba(255,248,234,0.24)", borderRadius: 30, borderWidth: 1, borderColor: "rgba(255,248,234,0.36)" },
  planChip: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 26 },
  planChipOn: { backgroundColor: "#FFF8EA" },
  planChipText: { color: C.white, fontSize: 12, fontWeight: "800" },
  planChipTextOn: { color: C.ink, fontWeight: "800" },
  planSale: { color: C.red, fontSize: 9, fontWeight: "700", marginTop: 2 },

  tableTitle: { color: "#FFF8EA", fontSize: 12, fontWeight: "800", letterSpacing: 2, marginTop: 18, marginBottom: 8, textAlign: "center", fontFamily: F.serif },
  table: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 14 },
  tableCol: { flex: 1, color: C.ink, fontSize: 11, fontWeight: "500" },
  tableHeadCol: { flex: 1 },
  tableCell: { width: 70, textAlign: "center", fontSize: 11 },
  tableHead: { width: 70, textAlign: "center", fontSize: 9, color: C.inkSub, fontWeight: "600", letterSpacing: 1 },

  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, backgroundColor: "#FFF8EA", borderTopWidth: 1, borderTopColor: "rgba(126,88,48,0.18)" },
  cta: { padding: 16, backgroundColor: C.red, borderRadius: 30, alignItems: "center", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  ctaCurrent: { backgroundColor: "rgba(31,46,74,0.16)", borderColor: "rgba(31,46,74,0.18)" },
  ctaText: { color: C.white, fontSize: 14, fontWeight: "800", letterSpacing: 3, fontFamily: F.serif },
  ctaTextCurrent: { color: C.inkSub },
  restore: { marginTop: 8, padding: 12, alignItems: "center" },
  restoreText: { color: C.ink, fontSize: 12, opacity: 1, textDecorationLine: "underline", fontWeight: "700", fontFamily: F.serif },
  legalLinks: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, paddingBottom: 4 },
  legalLinkText: { color: C.inkSub, fontSize: 11, opacity: 0.95, textDecorationLine: "underline", fontFamily: F.serif },
  legalLinkSep: { color: C.inkMuted, fontSize: 11 },
  legal: { color: C.inkSub, fontSize: 10, opacity: 0.9, textAlign: "center", marginTop: 14, lineHeight: 18, fontWeight: "600" },
});
