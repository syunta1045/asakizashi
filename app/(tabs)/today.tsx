import { View, Text, ScrollView, Pressable, RefreshControl, Share, Linking, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "../../lib/store";
import { stemReading, branchReading, dayPillar, pillarToString } from "../../lib/bazi";
import { rankingForDay } from "../../lib/ranking";
import { applyTone } from "../../lib/tone";
import { reiwaLabel } from "../../lib/dateUtils";
import { getDailyMessage, type DailyMessage } from "../../lib/interpretation";
import { useSubscription } from "../../lib/subscription";
import { useJournal } from "../../lib/journal";
import { track } from "../../lib/analytics";
import { LoadingView } from "../../components/StateViews";
import { Coachmark } from "../../components/Coachmark";
import { C, dawnGradient, F } from "../../lib/theme";

export default function Today() {
  const router = useRouter();
  const { nickname, pillars, mbti, bloodType, themes } = useUser();
  const { isPremium } = useSubscription();
  const streak = useJournal((s) => s.getStreak());
  const [base, setBase] = useState<DailyMessage | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // 当日の干支から自分の順位を算出
  const today = dayPillar(new Date());
  const userDayStr = pillars ? pillarToString(pillars.day) : "";
  const targetDayStr = `${today.stem}${today.branch}`;

  useEffect(() => {
    if (!userDayStr) return;
    track("today_viewed", { userDay: userDayStr, targetDay: targetDayStr });
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
    base ? `今日の旭兆 — ${base.headline}\n\n${base.body}\n\n#旭兆 #朝のお告げ` : "";

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

  if (!pillars) return null;
  if (!base) return <LoadingView message="今朝のお告げを読み解いています..." />;

  const rank = rankingForDay(today.branch).find((r) => r.branch === pillars.day.branch);
  const tuned = applyTone(base, { mbti, bloodType, themes });
  // score は base 解釈文のもの（中吉=75 等）、rank は当日の干支ランキング
  const m = { ...base, ...tuned, rank: rank?.rank ?? 1 };

  const dayReading = `${stemReading[today.stem]}・${branchReading[today.branch]}`;

  const chips = [pillars.day.stem + pillars.day.branch];
  if (mbti) chips.push(mbti);
  if (bloodType && bloodType !== "unknown") chips.push(`${bloodType}型`);

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.white} />}
        >
          {/* ヘッダー */}
          <View style={s.header}>
            <Text style={s.dateLabel}>{reiwaLabel(new Date())}</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
              <Text style={s.greet}>おはよう、{nickname || "あなた"}さん</Text>
              {streak > 0 && (
                <Text style={s.streak}>連続 {streak}日</Text>
              )}
            </View>
            <View style={s.chipRow}>
              {chips.map((c) => (
                <View key={c} style={s.chip}><Text style={s.chipText}>{c}</Text></View>
              ))}
            </View>
          </View>

          {/* 御神籤カード */}
          <View
            style={s.omikuji}
            accessibilityRole="summary"
            accessibilityLabel={`今日のお告げ。${m.kichi}、第${m.rank}位、${m.headline}`}
          >
            <View style={s.stamp}><Text style={s.stampText}>旭{"\n"}兆</Text></View>
            <Text style={s.omikujiHead}>◆ {targetDayStr}（{dayReading}）の日</Text>

            <View style={s.kichiRow}>
              <View style={s.kichiCol}>
                <Text style={s.kichiLabel}>運勢</Text>
                <Text style={s.kichiText}>{m.kichi}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.kichiCol}>
                <Text style={s.kichiLabel}>十二支中</Text>
                <Text style={s.rankText}>
                  <Text style={s.rankSmall}>第</Text>{m.rank}<Text style={s.rankSmall}>位</Text>
                </Text>
              </View>
            </View>

            <Text style={s.headline}>{m.headline}</Text>
            <View style={s.hr} />
            <Text style={s.body}>{m.body}</Text>

            <View style={{ marginTop: 16 }}>
              <View style={s.scoreLabel}>
                <Text style={s.scoreLabelText}>運気</Text>
                <Text style={s.scoreValue}>{m.score} / 100</Text>
              </View>
              <View style={s.scoreBar}>
                <View style={[s.scoreBarFill, { width: `${m.score}%` }]} />
              </View>
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
            <Text style={s.shareText}>{shareOpen ? "× とじる" : "↑ 今朝のお告げをシェアする"}</Text>
          </Pressable>
          {shareOpen && (
            <View style={s.shareMenu}>
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
            </View>
          )}

          {/* 今日の指針 */}
          <Section num="01" title="今日の指針" />
          <View style={s.guideCard}>
            <View style={[s.guideBlock, { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.15)" }]}>
              <View style={s.guideHead}>
                <View style={s.kichiBadge}><Text style={s.kichiBadgeText}>吉</Text></View>
                <Text style={s.guideHeadText}>やるとよいこと</Text>
              </View>
              {m.doActions.map((a, i) => <Text key={i} style={s.guideItem}>・{a}</Text>)}
            </View>
            <View style={s.guideBlock}>
              <View style={s.guideHead}>
                <View style={[s.kichiBadge, { backgroundColor: "rgba(184,150,86,0.25)" }]}><Text style={[s.kichiBadgeText, { color: C.gold }]}>忌</Text></View>
                <Text style={s.guideHeadText}>控えるべきこと</Text>
              </View>
              {m.avoidActions.map((a, i) => <Text key={i} style={s.guideItem}>・{a}</Text>)}
            </View>
          </View>

          {/* ラッキー */}
          <Section num="02" title="今日を運ぶもの" />
          <View style={s.luckyGrid}>
            {Object.entries(m.lucky).map(([k, v]) => (
              <View key={k} style={s.luckyCard}>
                <Text style={s.luckyLabel}>{labelOf(k)}</Text>
                <Text style={s.luckyValue}>{v}</Text>
              </View>
            ))}
          </View>

          <Pressable style={s.linkCard} onPress={() => router.push("/calendar")} accessibilityRole="button">
            <View style={s.linkIcon} />
            <View style={{ flex: 1 }}>
              <Text style={s.linkTitle}>月の流れを読み解く</Text>
              <Text style={s.linkSub}>今月の節目の日が見えます</Text>
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
            <Pressable style={s.premiumBanner} onPress={() => router.push("/premium")} accessibilityRole="button">
              <Text style={s.premiumBannerLabel}>◆ プレミアムで さらに深く</Text>
              <Text style={s.premiumBannerTitle}>命式の詳細・五行・月の流れ</Text>
              <Text style={s.premiumBannerCta}>7日間無料で試す ›</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
      <Coachmark
        k="today_intro"
        title="今朝のお告げが届いています"
        body="毎朝、命式と当日の干支から導かれた一行をお届けします。下にスワイプで更新、上のカードを長押しでシェアもできます。"
      />
    </LinearGradient>
  );
}

function labelOf(k: string) {
  return ({ item: "アイテム", color: "色", direction: "方位", food: "食", sound: "音", number: "数" } as Record<string, string>)[k] || k;
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

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { paddingTop: 14, paddingBottom: 14, paddingHorizontal: 8 },
  dateLabel: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 2, fontFamily: F.serif },
  greet: { color: C.white, fontSize: 18, marginTop: 2, fontWeight: "500", fontFamily: F.serif },
  chipRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: C.whiteBorder },
  chipText: { color: C.white, fontSize: 10, letterSpacing: 1, fontFamily: F.serif },
  streak: { color: C.white, fontSize: 11, opacity: 0.85, letterSpacing: 1, fontFamily: F.serif },

  omikuji: { backgroundColor: C.paper, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: C.paperBorder, position: "relative" },
  stamp: { position: "absolute", top: 14, right: 14, width: 38, height: 38, borderWidth: 1.5, borderColor: C.red, borderRadius: 4, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  stampText: { color: C.red, fontSize: 11, lineHeight: 13, textAlign: "center", fontWeight: "600", fontFamily: F.serif },
  omikujiHead: { color: C.gold, fontSize: 9, letterSpacing: 4, fontFamily: F.serif },
  kichiRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, gap: 16 },
  kichiCol: { alignItems: "center" },
  kichiLabel: { color: C.gold, fontSize: 9, letterSpacing: 3, fontFamily: F.serif },
  kichiText: { color: C.red, fontSize: 50, fontWeight: "600", letterSpacing: 4, lineHeight: 56, fontFamily: F.serif },
  divider: { width: 1, height: 56, backgroundColor: C.paperBorder },
  rankText: { color: C.ink, fontSize: 44, fontWeight: "300", lineHeight: 48, fontFamily: F.serif },
  rankSmall: { color: C.gold, fontSize: 18 },
  headline: { color: C.ink, fontSize: 18, lineHeight: 30, fontWeight: "500", textAlign: "center", marginTop: 18, fontFamily: F.serif },
  hr: { height: 1, backgroundColor: C.paperBorder, marginVertical: 14 },
  body: { color: C.inkSub, fontSize: 12, lineHeight: 22, fontFamily: F.serif },
  scoreLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  scoreLabelText: { color: C.gold, fontSize: 9, letterSpacing: 2 },
  scoreValue: { color: C.red, fontSize: 11, fontWeight: "600" },
  scoreBar: { height: 4, backgroundColor: "rgba(184,150,86,0.2)", borderRadius: 2, overflow: "hidden" },
  scoreBarFill: { height: "100%", backgroundColor: C.red },
  shareBtn: { marginTop: 12, padding: 12, alignItems: "center", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(255,255,255,0.08)" },
  shareText: { color: C.white, fontSize: 12, letterSpacing: 2, fontFamily: F.serif },
  shareMenu: { marginTop: 8, backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder, overflow: "hidden" },
  shareMenuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  shareMenuDivider: { height: 1, backgroundColor: C.paperBorder, marginHorizontal: 16 },
  shareDot: { width: 10, height: 10, borderRadius: 5 },
  shareMenuText: { flex: 1, color: C.ink, fontSize: 13, fontFamily: F.serif },
  shareMenuArrow: { color: C.gold, fontSize: 18 },

  section: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, marginBottom: 12 },
  sectionNum: { color: C.gold, fontSize: 11, fontWeight: "600", letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  sectionTitle: { color: C.white, fontSize: 13, fontWeight: "500", letterSpacing: 3, fontFamily: F.serif },

  guideCard: { backgroundColor: C.white12, borderRadius: 14, borderWidth: 1, borderColor: C.whiteBorder, overflow: "hidden" },
  guideBlock: { padding: 14 },
  guideHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  kichiBadge: { width: 18, height: 18, borderRadius: 2, backgroundColor: C.white95, alignItems: "center", justifyContent: "center" },
  kichiBadgeText: { color: C.good, fontSize: 11, fontWeight: "700", fontFamily: F.serif },
  guideHeadText: { color: C.white, fontSize: 11, fontWeight: "600", letterSpacing: 3 },
  guideItem: { color: C.white, fontSize: 13, lineHeight: 22 },

  luckyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  luckyCard: { width: "31.5%", backgroundColor: C.white12, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: C.whiteBorder },
  luckyLabel: { color: C.white, fontSize: 9, letterSpacing: 2, opacity: 0.85, marginBottom: 6 },
  luckyValue: { color: C.white, fontSize: 14, fontWeight: "500", fontFamily: F.serif },

  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 24, padding: 14, backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.paperBorder },
  linkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.red },
  linkTitle: { color: C.ink, fontSize: 13, fontWeight: "600", fontFamily: F.serif },
  linkSub: { color: C.inkSub, fontSize: 11, marginTop: 2, fontFamily: F.serif },
  linkArrow: { color: C.gold, fontSize: 18 },

  premiumBanner: { marginTop: 16, padding: 18, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  premiumBannerLabel: { color: C.paper, fontSize: 10, letterSpacing: 4, fontFamily: F.serif },
  premiumBannerTitle: { color: C.white, fontSize: 14, fontWeight: "600", marginTop: 6, fontFamily: F.serif },
  premiumBannerCta: { color: C.paper, fontSize: 12, fontWeight: "600", marginTop: 10, letterSpacing: 2, fontFamily: F.serif },
});
