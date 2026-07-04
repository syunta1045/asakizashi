import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSubscription, isTrialActive, trialDaysRemaining } from "../lib/subscription";
import { ensureRevenueCatConfigured, restorePurchases, isRevenueCatConfigured, getOfferings, purchasePackage, checkIntroEligibility } from "../lib/revenuecat";
import { track } from "../lib/analytics";
import { haptics } from "../lib/haptics";
import { C, morningGradient, F } from "../lib/theme";

const FEATURES: { f: string; free: string | boolean; prem: string | boolean }[] = [
  { f: "朝メモ・今日のペース", free: true, prem: true },
  { f: "夜の振り返り・連続記録", free: true, prem: true },
  { f: "今日の小さな準備", free: true, prem: true },
  { f: "月間カレンダー", free: true, prem: true },
  { f: "自分の傾向まとめ", free: true, prem: true },
  { f: "4テーマの深掘り", free: "一部", prem: "全テーマ" },
  { f: "気分の見返し", free: "直近7日", prem: "30日・90日" },
  { f: "大切な人を登録", free: "5件", prem: "無制限" },
  { f: "夜の通知時刻の調整", free: false, prem: true },
];

const DAILY_BENEFITS = [
  {
    label: "朝",
    title: "今日の動き方がすぐ決まる",
    body: "仕事・大切な人・人間関係・お金を、今日の小さな行動に分けて全文で見られます。",
  },
  {
    label: "波",
    title: "30日・90日の見返し",
    body: "気分の波・曜日のくせ・最長連続を、長い目でふり返れます。",
  },
  {
    label: "人",
    title: "大切な人を無制限に登録",
    body: "家族・推し・パートナーを上限なく登録して、距離感のメモを増やせます。",
  },
  {
    label: "時",
    title: "夜の振り返り時刻を選べる",
    body: "夜のリマインダーを19時〜23時から選んで、生活のリズムに合わせられます。",
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
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [plan, setPlan] = useState<PlanChoice>("yearly");
  const sub = useSubscription();
  const onTrial = isTrialActive(sub);
  const daysLeft = trialDaysRemaining(sub);

  // ストア実価格と intro 適格性。取得できない間は現行の固定表記にフォールバック
  const [prices, setPrices] = useState<{ yearly?: string; monthly?: string; yearlyNum?: number; monthlyNum?: number }>({});
  const [introEligible, setIntroEligible] = useState<boolean | null>(null);

  useEffect(() => {
    track("premium_viewed", { source: source ?? "unknown" });
    if (!isRevenueCatConfigured) return;
    let cancelled = false;
    (async () => {
      const init = await ensureRevenueCatConfigured();
      if (!init.ok || cancelled) return;
      const offerings = (await getOfferings()) as { current?: { availablePackages?: any[] } } | null;
      const pkgs = offerings?.current?.availablePackages ?? [];
      const yearly = pkgs.find((p: any) => matchesPackagePlan(p, "yearly"));
      const monthly = pkgs.find((p: any) => matchesPackagePlan(p, "monthly"));
      if (cancelled) return;
      setPrices({
        yearly: yearly?.product?.priceString,
        monthly: monthly?.product?.priceString,
        yearlyNum: typeof yearly?.product?.price === "number" ? yearly.product.price : undefined,
        monthlyNum: typeof monthly?.product?.price === "number" ? monthly.product.price : undefined,
      });
      const yearlyId = yearly?.product?.identifier;
      if (yearlyId) {
        const eligible = await checkIntroEligibility(yearlyId);
        if (!cancelled) setIntroEligible(eligible);
      }
    })();
    // source は初回表示の計測にだけ使う
    return () => { cancelled = true; };
  }, []);

  const yearlyPrice = prices.yearly ?? "¥3,800";
  const monthlyPrice = prices.monthly ?? "¥480";
  // 不適格が「確定」した時だけ 7日間無料の表記を落とす（判定不能は現行表記のまま）
  const showTrial = introEligible !== false;
  const perMonth = prices.yearlyNum
    ? `（月あたり ¥${Math.floor(prices.yearlyNum / 12).toLocaleString("ja-JP")}）`
    : prices.yearly
      ? ""
      : "（月あたり ¥316）";
  // フォールバックは既定価格(¥3,800/¥480)の実割引率 34% に合わせ、価格ロード前後で表示がブレないようにする
  const discount = prices.yearlyNum && prices.monthlyNum
    ? Math.max(0, Math.round((1 - prices.yearlyNum / (prices.monthlyNum * 12)) * 100))
    : 34;

  const ctaLabel = sub.isPremium
    ? (onTrial ? `お試し残り ${daysLeft} 日` : "ご利用中")
    : plan === "yearly"
      ? (showTrial ? "プレミアムを7日間試す" : "年額プランを購入")
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
        track("purchase_failed", { plan, reason: "no_offerings" });
        Alert.alert("商品を取得できませんでした", "通信環境を確認してもう一度お試しください。");
        return;
      }
      // 表示金額は必ずストア実価格を優先（請求額との不一致を作らない）
      const targetPrice = (target as any)?.product?.priceString ?? (plan === "yearly" ? yearlyPrice : monthlyPrice);
      Alert.alert(
        plan === "yearly" ? "プレミアム 年額を開始" : "プレミアム 月額を購入",
        plan === "yearly"
          ? (showTrial
              ? `最初の7日間は無料です。トライアル後、年額 ${targetPrice} の自動更新が始まります。いつでも解約できます。`
              : `無料体験の対象外のため、購入後すぐに年額 ${targetPrice} の自動更新が始まります。いつでも解約できます。`)
          : `無料体験はありません。購入後すぐに月額 ${targetPrice} の自動更新が始まります。いつでも解約できます。`,
        [
          { text: "キャンセル", style: "cancel" },
          { text: "購入", onPress: async () => {
              track("purchase_started", { plan, source: source ?? "unknown" });
              const r = await purchasePackage(target);
              if (!r.ok) {
                track("purchase_failed", { plan, reason: r.error ?? "unknown" });
                Alert.alert("購入できませんでした", r.error || "もう一度お試しください。");
                return;
              }
              if (!r.isPremium) {
                track("purchase_failed", { plan, reason: "not_confirmed" });
                Alert.alert("購入を確認できませんでした", "ストアの反映に少し時間がかかっている可能性があります。購入を復元してもう一度確認してください。");
                return;
              }
              track("purchase_completed", { plan: r.plan ?? plan, source: source ?? "unknown" });
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
              <Text style={[s.planChipText, plan === "yearly" && s.planChipTextOn]}>年額 {yearlyPrice}</Text>
              {plan === "yearly" && discount > 0 && <Text style={s.planSale}>{discount}%お得</Text>}
            </Pressable>
            <Pressable
              onPress={() => setPlan("monthly")}
              style={[s.planChip, plan === "monthly" && s.planChipOn]}
            accessibilityRole="button">
              <Text style={[s.planChipText, plan === "monthly" && s.planChipTextOn]}>月額 {monthlyPrice}</Text>
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
            {plan === "yearly"
              ? (showTrial
                  ? `初回のみ7日間無料。その後、年額 ${yearlyPrice}${perMonth}`
                  : `無料体験の対象外です。購入後すぐに年額 ${yearlyPrice}${perMonth}`)
              : `無料体験なし。購入後すぐに月額 ${monthlyPrice}`}
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
              track("restore_completed", { ok: result.ok, found: result.isPremium });
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
