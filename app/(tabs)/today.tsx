import { View, Text, ScrollView, Pressable, RefreshControl, Share, Linking, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { dayPillar, pillarToString } from "../../lib/bazi";
import { paceForDay } from "../../lib/pace";
import { applyTone } from "../../lib/tone";
import { reiwaLabel } from "../../lib/dateUtils";
import { getDailyMessage, type DailyMessage } from "../../lib/interpretation";
import { FEATURE_LOCKS, useSubscription } from "../../lib/subscription";
import { useJournal } from "../../lib/journal";
import { useRelations, compatibility } from "../../lib/relations";
import {
  buildMorningReflection,
  buildRelationNudge,
  buildWeeklyNudge,
  localDateKey,
  pickDailyRelation,
  previousDateKey,
} from "../../lib/dailyEngagement";
import { track } from "../../lib/analytics";
import { LoadingView } from "../../components/StateViews";
import { C, F, morningGradient } from "../../lib/theme";

export default function Today() {
  const router = useRouter();
  const { nickname, pillars, mbti, bloodType, themes } = useUser();
  const { isPremium } = useSubscription();
  const journalEntries = useJournal((s) => s.entries);
  const streak = useJournal((s) => s.getStreak());
  const relations = useRelations((s) => s.list);
  const [base, setBase] = useState<DailyMessage | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // 今日の日付とユーザー情報から、その日の見え方を組み立てる
  const today = dayPillar(new Date());
  const userDayStr = pillars ? pillarToString(pillars.day) : "";
  const targetDayStr = `${today.stem}${today.branch}`;

  useEffect(() => {
    // userDayStr が空（生年月日未入力）でも、fallback メッセージを取得する
    track("today_viewed", { userDay: userDayStr || "(none)", targetDay: targetDayStr });
    let cancelled = false;
    getDailyMessage(userDayStr, targetDayStr).then((msg) => {
      if (!cancelled) setBase(msg);
    });
    return () => { cancelled = true; };
  }, [userDayStr, targetDayStr]);

  const onRefresh = async () => {
    setRefreshing(true);
    const msg = await getDailyMessage(userDayStr, targetDayStr);
    setBase(msg);
    setRefreshing(false);
  };

  const buildShareText = () =>
    base ? `朝しるべの朝メモ — ${base.headline}\n\n${base.body}\n\n#朝しるべ #朝のセルフケア` : "";

  const onShare = async () => {
    if (!base) return;
    try {
      await Share.share({ message: buildShareText() });
    } catch {}
  };

  const shareToLine = async () => {
    if (!base) return;
    track("share_clicked", { channel: "line" });
    const url = `https://line.me/R/msg/text/?${encodeURIComponent(buildShareText())}`;
    try { await Linking.openURL(url); } catch {}
  };

  const shareToX = async () => {
    if (!base) return;
    track("share_clicked", { channel: "x" });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText())}`;
    try { await Linking.openURL(url); } catch {}
  };

  if (!base) return <LoadingView message="朝メモを準備しています..." />;

  // 生年月日未入力時は pillars が null。命式依存の機能はスキップして、
  // MBTI + 関心テーマ + 日付シードで動作する。
  const todayPaceEntries = paceForDay(today.branch);
  const userYearStr = pillars ? pillarToString(pillars.year) : "";
  const userMonthStr = pillars ? pillarToString(pillars.month) : "";
  const todayKey = localDateKey();
  const morningReflection = buildMorningReflection(journalEntries[previousDateKey()]);
  const weeklyNudge = buildWeeklyNudge(streak, journalEntries);
  const dailyRelation = pillars ? pickDailyRelation(relations, todayKey) : null;
  const dailyRelationNudge = pillars && dailyRelation
    ? buildRelationNudge(
        dailyRelation,
        compatibility(pillars.year.branch, dailyRelation.pillars.year.branch),
        todayPaceEntries.find((r) => r.branch === dailyRelation.pillars.year.branch)?.position
      )
    : null;
  const personalSeed = [
    userYearStr,
    userMonthStr,
    userDayStr,
    targetDayStr,
    mbti ?? "",
    bloodType ?? "",
    ...themes,
  ].join("|");
  const tuned = applyTone(base, { mbti, bloodType, themes, personalSeed });
  const m = { ...base, ...tuned };
  const luckyEntries = Object.entries(m.lucky);
  const visibleLuckyEntries = isPremium
    ? luckyEntries
    : luckyEntries.slice(0, FEATURE_LOCKS.sixLuckyItems.freeLimit);
  const hiddenLuckyEntries = isPremium
    ? []
    : luckyEntries.slice(FEATURE_LOCKS.sixLuckyItems.freeLimit);
  const hiddenLuckyLabels = hiddenLuckyEntries.map(([k]) => labelOf(k));

  const tempo = morningTempo(m.score);
  const displayBody = formatDailyBody(m.body);
  const deepInsights = buildDeepInsights({
    score: m.score,
    doActions: m.doActions,
    avoidActions: m.avoidActions,
    lucky: m.lucky,
    mbti,
    bloodType,
    themes,
  });
  const primaryDeepInsight = pickPrimaryInsight(deepInsights, themes);
  const openPremium = (source: string) => {
    track("premium_viewed", { source });
    router.push("/premium");
  };
  const shareRelationLine = async () => {
    if (!dailyRelationNudge) return;
    track("share_clicked", { channel: "relation_line" });
    try {
      await Share.share({
        message: `${dailyRelationNudge.title}\n${dailyRelationNudge.suggestedLine}`,
      });
    } catch {}
  };

  const chips: string[] = [];
  if (mbti) chips.push(mbti);
  if (bloodType && bloodType !== "unknown") chips.push(`${bloodType}型`);

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.white} />}
        >
          {/* ヘッダー */}
          <View style={s.header}>
            <Text style={s.dateLabel}>{reiwaLabel(new Date())}</Text>
            <View style={s.greetRow}>
              <Text style={s.greet}>おはよう、{nickname || "あなた"}さん</Text>
              {streak > 0 && (
                <Text style={s.streak}>連続 {streak}日</Text>
              )}
            </View>
            {chips.length > 0 && (
              <View style={s.chipRow}>
                {chips.map((c) => (
                  <View key={c} style={s.chip}><Text style={s.chipText}>{c}</Text></View>
                ))}
              </View>
            )}
          </View>

          <View
            style={s.morningMemoCard}
            accessibilityRole="summary"
            accessibilityLabel={`朝メモ。${m.headline}。${m.body}`}
          >
            <View style={s.stamp}><View style={s.stampMark} /></View>
            <Text style={s.oneLineLabel}>朝メモ</Text>

            <Text
              style={s.headline}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.86}
              textBreakStrategy="balanced"
            >
              {m.headline}
            </Text>

            {(mbti || (bloodType && bloodType !== "unknown")) && (
              <Text style={s.personalLine}>
                ── {mbti}{mbti && bloodType && bloodType !== "unknown" ? "・" : ""}{bloodType && bloodType !== "unknown" ? `${bloodType}型` : ""}のあなたへ ──
              </Text>
            )}

            <View style={s.hr} />
            <View style={s.bodyPanel}>
              <Text style={s.body} textBreakStrategy="balanced">{displayBody}</Text>
            </View>

            <View style={s.detailStrip}>
              <Text style={s.detailText}>今日のペース</Text>
              <Text style={s.detailDot}>・</Text>
              <Text style={s.detailText}>{tempo.label}</Text>
            </View>
          </View>

          {/* シェアボタン */}
          <Pressable
            style={s.shareBtn}
            onPress={() => setShareOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={shareOpen ? "シェアメニューを閉じる" : "シェアメニューを開く"}
            accessibilityState={{ expanded: shareOpen }}
          >
            <Text style={s.shareText}>{shareOpen ? "× とじる" : "↑ 朝メモをシェアする"}</Text>
          </Pressable>

          {(morningReflection || dailyRelationNudge || weeklyNudge) && (
            <>
              <Section num="00" title="今日だけのきっかけ" />
              <View style={s.dailyStack}>
                {morningReflection && (
                  <View style={s.dailyCard}>
                    <Text style={s.dailyLabel}>昨日の振り返りから</Text>
                    <Text style={s.dailyTitle}>{morningReflection.title}</Text>
                    <Text style={s.dailyBody}>{morningReflection.body}</Text>
                    <Text style={s.dailyAction}>今日の小さな一手: {morningReflection.action}</Text>
                  </View>
                )}

                {dailyRelationNudge ? (
                  <View style={s.dailyCard}>
                    <View style={s.dailyHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.dailyLabel}>今日の大切な人</Text>
                        <Text style={s.dailyTitle}>{dailyRelationNudge.title}</Text>
                      </View>
                      <View style={s.dailyBadge}>
                        <Text style={s.dailyBadgeText}>毎朝更新</Text>
                      </View>
                    </View>
                    <Text style={s.dailyBody}>{dailyRelationNudge.body}</Text>
                    <View style={s.lineBox}>
                      <Text style={s.lineLabel}>送るなら、こんな一言</Text>
                      <Text style={s.lineText}>{dailyRelationNudge.suggestedLine}</Text>
                    </View>
                    <Pressable style={s.lineShareBtn} onPress={shareRelationLine} accessibilityRole="button">
                      <Text style={s.lineShareText}>一言を共有する</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={s.dailyCard} onPress={() => router.push("/relations")} accessibilityRole="button">
                    <Text style={s.dailyLabel}>今日の大切な人</Text>
                    <Text style={s.dailyTitle}>大切な人を登録すると、朝の一言が届きます</Text>
                    <Text style={s.dailyBody}>相手の気持ちを決めつけず、自分の言葉選びと距離感を整えるためのカードです。</Text>
                    <Text style={s.dailyAction}>大切な人を登録する ›</Text>
                  </Pressable>
                )}

                <View style={s.dailyCard}>
                  <View style={s.dailyHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.dailyLabel}>連続記録</Text>
                      <Text style={s.dailyTitle}>{weeklyNudge.title}</Text>
                    </View>
                    <View style={s.progressRing}>
                      <Text style={s.progressText}>{weeklyNudge.label}</Text>
                    </View>
                  </View>
                  <Text style={s.dailyBody}>{weeklyNudge.body}</Text>
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${Math.min(100, (weeklyNudge.progress / 7) * 100)}%` }]} />
                  </View>
                  <Pressable style={s.dailySubtleBtn} onPress={() => router.push("/journal")} accessibilityRole="button">
                    <Text style={s.dailySubtleText}>夜の振り返りを続ける ›</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {/* 今日の行動メモ */}
          <Section num="01" title="今日の行動メモ" />
          <View style={s.guideCard}>
            <View style={[s.guideBlock, { borderBottomWidth: 1, borderBottomColor: C.paperBorder }]}>
              <View style={s.guideHead}>
                <View style={s.guideBadge}><Text style={s.guideBadgeText}>✓</Text></View>
                <Text style={s.guideHeadText}>やってみること</Text>
              </View>
              {m.doActions.map((a, i) => <Text key={i} style={s.guideItem}>・{a}</Text>)}
            </View>
            <View style={s.guideBlock}>
              <View style={s.guideHead}>
                <View style={[s.guideBadge, { backgroundColor: "rgba(184,150,86,0.25)" }]}><Text style={[s.guideBadgeText, { color: C.gold }]}>!</Text></View>
                <Text style={s.guideHeadText}>今日は控えたいこと</Text>
              </View>
              {m.avoidActions.map((a, i) => <Text key={i} style={s.guideItem}>・{a}</Text>)}
            </View>
          </View>

          <Section num="02" title="テーマ別セルフケア" />
          <View style={s.deepCard}>
            <View style={s.deepHeader}>
              <Text style={s.deepEyebrow}>{isPremium ? "あなた専用の4テーマ" : "一部だけ公開中"}</Text>
              <Text style={s.deepTitle}>
                {isPremium ? "今日の動き方を、もう一段具体的に" : `${primaryDeepInsight.label}のヒント`}
              </Text>
            </View>
            <Text style={s.deepLead}>
              {isPremium
                ? "朝メモを、仕事や大切な人とのことに分けて、ぐっと身近にします。"
                : "無料では一部だけ見られます。プレミアムでは、テーマ別に「どう整えるか」まで確認できます。"}
            </Text>

            {isPremium ? (
              <View style={s.deepList}>
                {deepInsights.map((insight, i) => (
                  <View
                    key={insight.key}
                    style={[s.deepInsightRow, i === deepInsights.length - 1 && s.deepInsightRowLast]}
                  >
                    <Text style={s.deepInsightLabel}>{insight.label}</Text>
                    <Text style={s.deepInsightText}>{insight.detail}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <>
                <View style={s.deepPreview}>
                  <Text style={s.deepPreviewLabel}>{primaryDeepInsight.label}</Text>
                  <Text style={s.deepPreviewText}>{primaryDeepInsight.preview}</Text>
                </View>
                <View style={s.deepLockedRow}>
                  {deepInsights.map((insight) => (
                    <View key={insight.key} style={s.deepLockedPill}>
                      <Text style={s.deepLockedLabel}>{insight.label}</Text>
                      <Text style={s.deepLockedSub}>プレミアム</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={s.deepCta}
                  onPress={() => openPremium("today_deep_preview")}
                  accessibilityRole="button"
                >
                  <Text style={s.deepCtaText}>仕事・大切な人・人間関係・お金を見る ›</Text>
                </Pressable>
              </>
            )}
          </View>

          <Section num="03" title="整えるヒント" />
          <View style={s.luckyGrid}>
            {visibleLuckyEntries.map(([k, v]) => (
              <View key={k} style={s.luckyCard}>
                <Text style={s.luckyLabel}>{labelOf(k)}</Text>
                <Text style={s.luckyValue}>{v}</Text>
              </View>
            ))}
            {hiddenLuckyEntries.map(([k]) => (
              <Pressable
                key={k}
                style={[s.luckyCard, s.luckyCardLocked]}
                onPress={() => openPremium("today_lucky_locked")}
                accessibilityRole="button"
              >
                <Text style={s.luckyLabel}>{labelOf(k)}</Text>
                <Text style={s.luckyLockedValue}>プレミアム</Text>
              </Pressable>
            ))}
          </View>
          {!isPremium && hiddenLuckyLabels.length > 0 && (
            <Pressable style={s.luckyTeaser} onPress={() => openPremium("today_lucky_teaser")} accessibilityRole="button">
              <Text style={s.luckyTeaserText}>プレミアムで、{hiddenLuckyLabels.join("・")}まで整える ›</Text>
            </Pressable>
          )}

          <Pressable style={s.linkCard} onPress={() => router.push("/calendar")} accessibilityRole="button">
            <View style={s.linkIcon} />
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>月間カレンダーを見る</Text>
              <Text style={s.linkSub}>今月の意識したい日をメモできます</Text>
            </View>
            <Text style={s.linkArrow}>›</Text>
          </Pressable>

          <Pressable style={s.linkCard} onPress={() => router.push("/journal")} accessibilityRole="button">
            <View style={[s.linkIcon, { backgroundColor: C.gold }]} />
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>今晩の振り返りを書く</Text>
              <Text style={s.linkSub}>連続記録が育っていきます</Text>
            </View>
            <Text style={s.linkArrow}>›</Text>
          </Pressable>

          {!isPremium && (
            <Pressable style={s.premiumBanner} onPress={() => openPremium("today_bottom_banner")} accessibilityRole="button">
              <Text style={s.premiumBannerLabel}>◆ プレミアムで もっと使いやすく</Text>
              <Text style={s.premiumBannerTitle}>毎朝の4テーマヒント・月間カレンダー</Text>
              <Text style={s.premiumBannerCta}>7日間試してみる ›</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
      <Modal visible={shareOpen} transparent animationType="fade" onRequestClose={() => setShareOpen(false)}>
        <Pressable style={s.shareOverlay} onPress={() => setShareOpen(false)}>
          <Pressable style={s.shareSheet} onPress={() => {}}>
            <Pressable style={s.shareMenuRow} onPress={() => { shareToLine(); setShareOpen(false); }} accessibilityRole="button">
              <View style={[s.shareDot, { backgroundColor: "#06C755" }]} />
              <Text style={s.shareMenuText}>LINEで送る</Text>
              <Text style={s.shareMenuArrow}>›</Text>
            </Pressable>
            <View style={s.shareMenuDivider} />
            <Pressable style={s.shareMenuRow} onPress={() => { shareToX(); setShareOpen(false); }} accessibilityRole="button">
              <View style={[s.shareDot, { backgroundColor: C.ink }]} />
              <Text style={s.shareMenuText}>Xにポストする</Text>
              <Text style={s.shareMenuArrow}>›</Text>
            </Pressable>
            <View style={s.shareMenuDivider} />
            <Pressable style={s.shareMenuRow} onPress={() => { onShare(); setShareOpen(false); }} accessibilityRole="button">
              <View style={[s.shareDot, { backgroundColor: C.gold }]} />
              <Text style={s.shareMenuText}>その他のアプリ…</Text>
              <Text style={s.shareMenuArrow}>›</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

function labelOf(k: string) {
  return ({ item: "持ちもの", color: "色", direction: "場所", food: "食事", sound: "音", number: "目安" } as Record<string, string>)[k] || k;
}

function morningTempo(score: number) {
  if (score >= 82) {
    return { label: "前向きに動く", body: "午前の一手を少しだけ早めると、予定が進みやすい日です。" };
  }
  if (score >= 65) {
    return { label: "ほどよく進める", body: "急ぎすぎず、やることを一つずつ整えると安定します。" };
  }
  return { label: "ゆっくり整える", body: "予定を詰めすぎず、余白を残すほど落ち着きやすい日です。" };
}

function Section({ num, title }: { num: string; title: string }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionNum}>{num}</Text>
      <View style={s.sectionLine} />
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

function formatDailyBody(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[\u6728\u706b\u571f\u91d1\u6c34]\u306e\u6c17\u304c[^。\n]*。?/g, "")
    .replace(/\u904b\u6c17/g, "調子")
    .replace(/\u547d\u5f0f/g, "傾向")
    .replace(/\u5e72\u652f/g, "生年月日")
    .replace(/\u5341\u4e8c\u652f/g, "生まれ年")
    .replace(/\u76f8\u6027/g, "距離感")
    .replace(/\u30e9\u30c3\u30ad\u30fc/g, "整える")
    .replace(/\u5409です/g, "おすすめです")
    .replace(/\u5409。/g, "おすすめ。")
    .replace(/\u5409/g, "おすすめ")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n/g, ""))
    .join("\n\n");
}

type DeepInsight = {
  key: "work" | "care" | "people" | "money";
  label: string;
  preview: string;
  detail: string;
};

type DeepInput = {
  score: number;
  doActions: string[];
  avoidActions: string[];
  lucky: DailyMessage["lucky"];
  mbti: string | null;
  bloodType: string | null;
  themes: string[];
};

function buildDeepInsights(input: DeepInput): DeepInsight[] {
  const action = input.doActions[0] ?? "朝のうちに小さな用事を一つ終える";
  const secondAction = input.doActions[1] ?? "返事を一つだけ丁寧に返す";
  const caution = input.avoidActions[0] ?? "急ぎすぎること";
  const tempo = input.score >= 82
    ? "今日は前に出るほどペースが整います。"
    : input.score >= 65
      ? "大きく動くより、小さく確かめながら進むとよさそうです。"
      : "無理に広げず、受け取る姿勢を大切にしたい日です。";
  const paceLine = input.score >= 82
    ? "午前の一手を少しだけ早めると、予定が進みやすくなります。"
    : input.score >= 65
      ? "焦らず順番を整えるほど、午後の判断が軽くなります。"
      : "今日は守りを固め、明日に残す余白を作ると落ち着きます。";
  const typeHint = input.mbti
    ? `${input.mbti}${input.bloodType && input.bloodType !== "unknown" ? `・${input.bloodType}型` : ""}のあなたは、最初の反応を少しだけ遅らせると本音が見えます。`
    : "自分の気持ちを一度言葉にしてから動くと、選び方が静かに整います。";
  const hasCareTheme = input.themes.some((t) => /大切な人|パートナー|結婚|家庭/.test(t));
  const hasWorkTheme = input.themes.some((t) => /仕事|副業|独立|学び/.test(t));
  const hasMoneyTheme = input.themes.some((t) => /お金|整え方|副業|独立/.test(t));
  const hasPeopleTheme = input.themes.some((t) => /人間関係|推し|家族/.test(t));

  return [
    {
      key: "work",
      label: "仕事",
      preview: hasWorkTheme
        ? "仕事まわりが今日の中心。小さな提案や確認が、次のきっかけを作ります。"
        : "仕事は、急な勝負よりも下準備に強い日です。",
      detail: `${tempo} ${paceLine} 仕事では「${action}」を先に置くと、午後の判断が軽くなります。避けたいのは${caution}。完璧な答えより、次に進める一手を選んで。`,
    },
    {
      key: "care",
      label: "大切な人",
      preview: hasCareTheme
        ? "大切な人には、言葉の量より温度が大事。短くても丁寧な一言が効きます。"
        : "大切な人とは、追いかけるより相手の反応を受け取る日です。",
      detail: `大切な人には、相手を動かそうとするより「${secondAction}」くらいの小さな接点が合います。${typeHint} 今日の色の${input.lucky.color}を身近に置くと、言葉がやわらぎます。`,
    },
    {
      key: "people",
      label: "人間関係",
      preview: hasPeopleTheme
        ? "人間関係は、久しぶりの相手ほど一言を置く余地があります。"
        : "人間関係は、近い人への一言で空気が変わる日です。",
      detail: `人間関係は「聞く」側に回るほど整います。今日は最初に結論を急がず、相手の言葉を一つ拾って返すと関係がほどけます。`,
    },
    {
      key: "money",
      label: "お金",
      preview: hasMoneyTheme
        ? "お金は、増やす前に整える日。小さな見直しが効きます。"
        : "お金は、使うより整える日。買う前の一呼吸がおすすめです。",
      detail: `お金まわりは派手な動きより管理に向きます。財布・サブスク・領収書のどれか一つを見直して。落ち着きやすい場所は${input.lucky.direction}、目安は${input.lucky.number}。買い足すより、余白を作るほど落ち着きます。`,
    },
  ];
}

function pickPrimaryInsight(insights: DeepInsight[], themes: string[]) {
  const priority: DeepInsight["key"][] = [];
  if (themes.some((t) => /仕事|副業|独立|学び/.test(t))) priority.push("work");
  if (themes.some((t) => /大切な人|パートナー|結婚|家庭/.test(t))) priority.push("care");
  if (themes.some((t) => /お金|整え方/.test(t))) priority.push("money");
  if (themes.some((t) => /人間関係|推し|家族/.test(t))) priority.push("people");
  for (const key of priority) {
    const hit = insights.find((insight) => insight.key === key);
    if (hit) return hit;
  }
  return insights[0];
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 30 },
  header: { paddingTop: 18, paddingBottom: 16, paddingHorizontal: 3 },
  dateLabel: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 2, fontFamily: F.serif, fontWeight: "700" },
  greetRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  greet: { color: C.white, fontSize: 21, lineHeight: 30, marginTop: 4, fontWeight: "700", fontFamily: F.serif, flex: 1 },
  chipRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 14, backgroundColor: "rgba(255,248,234,0.26)", borderWidth: 1, borderColor: "rgba(255,248,234,0.42)" },
  chipText: { color: C.white, fontSize: 10, letterSpacing: 1, fontFamily: F.serif, fontWeight: "700" },
  streak: { color: "#FFF8EA", fontSize: 11, opacity: 0.95, letterSpacing: 1, fontFamily: F.serif, fontWeight: "700", paddingBottom: 4 },

  morningMemoCard: { backgroundColor: "#FFF8E8", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "rgba(126,88,48,0.22)", position: "relative", shadowColor: "#42231A", shadowOpacity: 0.14, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  stamp: { position: "absolute", top: 16, right: 16, width: 40, height: 40, borderWidth: 1.5, borderColor: "rgba(158,47,47,0.72)", borderRadius: 5, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], backgroundColor: "rgba(158,47,47,0.04)" },
  stampMark: { width: 13, height: 13, borderRadius: 7, backgroundColor: "rgba(158,47,47,0.72)" },
  oneLineLabel: { color: C.red, fontSize: 11, letterSpacing: 2, textAlign: "center", marginTop: 12, fontFamily: F.serif, fontWeight: "800" },
  subStatsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, gap: 18 },
  subStat: { alignItems: "center" },
  subStatDiv: { width: 1, height: 28, backgroundColor: C.paperBorder },
  subStatValue: { color: C.ink, fontSize: 20, fontWeight: "500", fontFamily: F.serif, letterSpacing: 1 },
  subStatUnit: { color: C.gold, fontSize: 13 },
  subStatLabel: { color: C.gold, fontSize: 9, letterSpacing: 2, marginTop: 2, fontFamily: F.serif },
  personalLine: { color: "#8B642A", fontSize: 10, letterSpacing: 1, textAlign: "center", marginTop: 12, fontFamily: F.serif, opacity: 0.9, fontWeight: "700" },
  headline: { color: "#221821", fontSize: 29, lineHeight: 40, fontWeight: "800", textAlign: "center", marginTop: 18, fontFamily: F.serif, alignSelf: "center", width: "100%", includeFontPadding: false },
  hr: { height: 1, backgroundColor: "rgba(126,88,48,0.22)", marginVertical: 16 },
  bodyPanel: { backgroundColor: "rgba(255,255,255,0.42)", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.08)" },
  body: { color: "#4E4038", fontSize: 14, lineHeight: 27, fontFamily: F.serif, fontWeight: "600" },
  detailStrip: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", marginTop: 17, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(126,88,48,0.18)" },
  detailText: { color: "#9A6D2C", fontSize: 10, letterSpacing: 1, fontFamily: F.serif, fontWeight: "800" },
  detailDot: { color: C.gold, fontSize: 10, opacity: 0.65, marginHorizontal: 6 },
  shareBtn: { marginTop: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center", borderRadius: 24, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", backgroundColor: "#FFF8EA", shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  shareText: { color: "#5B393B", fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
  shareOverlay: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 16, paddingBottom: 28, backgroundColor: "rgba(14,18,30,0.42)" },
  shareSheet: { marginBottom: 88, backgroundColor: C.paper, borderRadius: 16, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  shareMenuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  shareMenuDivider: { height: 1, backgroundColor: C.paperBorder, marginHorizontal: 16 },
  shareDot: { width: 10, height: 10, borderRadius: 5 },
  shareMenuText: { flex: 1, color: C.ink, fontSize: 13, fontFamily: F.serif },
  shareMenuArrow: { color: C.gold, fontSize: 18 },

  dailyStack: { gap: 10 },
  dailyCard: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", padding: 16, shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  dailyHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dailyLabel: { color: C.gold, fontSize: 10, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  dailyTitle: { color: C.ink, fontSize: 15, lineHeight: 23, fontWeight: "800", marginTop: 5, fontFamily: F.serif },
  dailyBody: { color: "#574740", fontSize: 13, lineHeight: 23, marginTop: 8, fontWeight: "600", fontFamily: F.serif },
  dailyAction: { color: C.red, fontSize: 12, lineHeight: 20, marginTop: 10, fontWeight: "800", fontFamily: F.serif },
  dailyBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: "rgba(158,47,47,0.08)", borderWidth: 1, borderColor: "rgba(158,47,47,0.14)" },
  dailyBadgeText: { color: C.red, fontSize: 9, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
  lineBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.46)", borderWidth: 1, borderColor: "rgba(126,88,48,0.10)" },
  lineLabel: { color: C.gold, fontSize: 9, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  lineText: { color: C.ink, fontSize: 13, lineHeight: 22, marginTop: 6, fontWeight: "700", fontFamily: F.serif },
  lineShareBtn: { marginTop: 10, paddingVertical: 11, alignItems: "center", borderRadius: 22, backgroundColor: C.red },
  lineShareText: { color: C.white, fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },
  progressRing: { minWidth: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(158,47,47,0.08)", borderWidth: 1, borderColor: "rgba(158,47,47,0.20)" },
  progressText: { color: C.red, fontSize: 11, fontWeight: "800", fontFamily: F.serif },
  progressTrack: { marginTop: 12, height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(184,150,86,0.18)" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: C.red },
  dailySubtleBtn: { marginTop: 10, alignSelf: "flex-start", paddingVertical: 5, paddingRight: 10 },
  dailySubtleText: { color: C.red, fontSize: 12, fontWeight: "800", fontFamily: F.serif },

  section: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26, marginBottom: 12 },
  sectionNum: { color: "#FFF8EA", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,248,234,0.42)" },
  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },

  guideCard: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", overflow: "hidden", shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  guideBlock: { padding: 16 },
  guideHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  guideBadge: { width: 18, height: 18, borderRadius: 2, backgroundColor: C.white95, alignItems: "center", justifyContent: "center" },
  guideBadgeText: { color: C.good, fontSize: 11, fontWeight: "700", fontFamily: F.serif },
  guideHeadText: { color: C.ink, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  guideItem: { color: "#574740", fontSize: 14, lineHeight: 24, fontWeight: "700" },

  deepCard: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", padding: 16, shadowColor: "#42231A", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  deepHeader: { gap: 5 },
  deepEyebrow: { color: C.gold, fontSize: 10, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  deepTitle: { color: C.ink, fontSize: 16, lineHeight: 24, fontWeight: "800", fontFamily: F.serif },
  deepLead: { color: C.inkSub, fontSize: 12, lineHeight: 22, marginTop: 8, fontFamily: F.serif, fontWeight: "600" },
  deepPreview: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.paperBorder },
  deepPreviewLabel: { color: C.red, fontSize: 11, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  deepPreviewText: { color: "#4E4038", fontSize: 14, lineHeight: 25, marginTop: 7, fontFamily: F.serif, fontWeight: "700" },
  deepList: { marginTop: 14, borderTopWidth: 1, borderTopColor: C.paperBorder },
  deepInsightRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.paperBorder },
  deepInsightRowLast: { borderBottomWidth: 0, paddingBottom: 2 },
  deepInsightLabel: { color: C.red, fontSize: 11, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },
  deepInsightText: { color: "#4E4038", fontSize: 13, lineHeight: 24, marginTop: 6, fontFamily: F.serif, fontWeight: "600" },
  deepLockedRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  deepLockedPill: { width: "48.5%", paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(158,47,47,0.16)", backgroundColor: "rgba(158,47,47,0.06)" },
  deepLockedLabel: { color: C.ink, fontSize: 12, fontWeight: "800", fontFamily: F.serif },
  deepLockedSub: { color: C.red, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 4, fontFamily: F.serif },
  deepCta: { marginTop: 14, paddingVertical: 13, borderRadius: 24, alignItems: "center", backgroundColor: C.red },
  deepCtaText: { color: C.white, fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: F.serif },

  luckyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  luckyCard: { width: "31.5%", backgroundColor: "#FFF8EA", borderRadius: 12, paddingVertical: 15, paddingHorizontal: 10, alignItems: "center", borderWidth: 1, borderColor: "rgba(126,88,48,0.16)" },
  luckyCardLocked: { backgroundColor: "rgba(255,248,234,0.62)", borderColor: "rgba(158,47,47,0.24)" },
  luckyLabel: { color: "#9A6D2C", fontSize: 9, letterSpacing: 2, marginBottom: 7, fontWeight: "800" },
  luckyValue: { color: C.ink, fontSize: 14, fontWeight: "800", fontFamily: F.serif, textAlign: "center" },
  luckyLockedValue: { color: C.red, fontSize: 12, fontWeight: "800", fontFamily: F.serif, textAlign: "center", letterSpacing: 1 },
  luckyTeaser: { marginTop: 8, paddingVertical: 10, alignItems: "center" },
  luckyTeaserText: { color: "#FFF8EA", fontSize: 11, fontWeight: "800", letterSpacing: 2, fontFamily: F.serif },

  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, padding: 15, backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.red },
  linkTitle: { color: C.ink, fontSize: 13, fontWeight: "600", fontFamily: F.serif },
  linkSub: { color: C.inkSub, fontSize: 11, marginTop: 2, fontFamily: F.serif },
  linkArrow: { color: C.gold, fontSize: 18 },

  premiumBanner: { marginTop: 16, padding: 18, borderRadius: 14, backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(126,88,48,0.18)" },
  premiumBannerLabel: { color: C.gold, fontSize: 10, fontWeight: "600", letterSpacing: 4, fontFamily: F.serif },
  premiumBannerTitle: { color: C.ink, fontSize: 14, fontWeight: "600", marginTop: 6, fontFamily: F.serif },
  premiumBannerCta: { color: C.inkSub, fontSize: 12, fontWeight: "700", marginTop: 10, letterSpacing: 2, fontFamily: F.serif },
});
