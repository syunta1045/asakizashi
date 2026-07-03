import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useUser, notifyTimeFrom } from "../lib/store";
import { useRelations } from "../lib/relations";
import { useJournal } from "../lib/journal";
import { useSubscription, isTrialActive, trialDaysRemaining } from "../lib/subscription";
import { useCoachmark } from "../lib/coachmark";
import { performSignOutCleanup } from "../lib/postSignIn";
import { isSupabaseConfigured, getSession, deleteAccount } from "../lib/supabase";
import { getNotificationPermissionGranted, requestNotificationPermission, scheduleMorningNotification, cancelAllNotifications } from "../lib/notifications";
import { exportUserData } from "../lib/export";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, morningGradient, F } from "../lib/theme";

export default function Settings() {
  const router = useRouter();
  const u = useUser();
  const relReset = useRelations((s) => s.reset);
  const journalReset = useJournal((s) => s.reset);
  const subReset = useSubscription((s) => s.reset);
  const coachReset = useCoachmark((s) => s.reset);
  const sub = useSubscription();
  const appVersion = Constants.expoConfig?.version || "0.1.0";
  const planLabel = (() => {
    if (sub.plan === "premium_yearly") return "プレミアム（年額）";
    if (sub.plan === "premium_monthly") return "プレミアム（月額）";
    if (sub.plan === "trial" && isTrialActive(sub)) {
      return `プレミアムお試し（残り${trialDaysRemaining(sub)}日）`;
    }
    return "通常プラン";
  })();

  /**
   * ローカル側の全クリア。サインアウト/退会/手動リセット いずれの動線でも必ず通る。
   * RevenueCat の logout / Supabase signOut は performSignOutCleanup() で別途実行する。
   */
  const fullLocalWipe = async () => {
    u.reset();
    relReset();
    journalReset();
    subReset();
    coachReset();
    await cancelAllNotifications();
    try {
      const keys = await AsyncStorage.getAllKeys();
      const targets = keys.filter((k) => k.startsWith("asakizashi-") || k.startsWith("interp:"));
      if (targets.length > 0) await AsyncStorage.multiRemove(targets);
    } catch {}
  };
  const [notif, setNotif] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const granted = await getNotificationPermissionGranted();
      setNotif(granted && useUser.getState().morningEnabled);
      const session = await getSession();
      setSignedIn(!!session);
      setEmail(session?.user?.email ?? null);
    })();
  }, []);

  const onSignOut = () => {
    Alert.alert(
      "サインアウト",
      "この端末のローカルデータも削除されます。\nサーバー側のデータ（プロフィール・つながり・記録）は残るので、再ログインで復元できます。",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "サインアウト", style: "destructive", onPress: async () => {
            await performSignOutCleanup();   // Supabase signOut + RevenueCat reset + analytics
            await fullLocalWipe();             // ローカル Zustand + AsyncStorage の全削除
            setSignedIn(false);
            router.replace("/welcome");
          } },
      ]
    );
  };

  const onToggleNotif = async (v: boolean) => {
    if (v) {
      const ok = await requestNotificationPermission();
      if (ok) {
        u.setField("morningEnabled", true);
        await scheduleMorningNotification(u.wakeUpTime, u.nickname, {
          morningEnabled: true,
          eveningEnabled: u.eveningEnabled,
          eveningTime: u.eveningTime,
        });
        setNotif(true);
      }
    } else {
      u.setField("morningEnabled", false);
      await scheduleMorningNotification(u.wakeUpTime, u.nickname, {
        morningEnabled: false,
        eveningEnabled: u.eveningEnabled,
        eveningTime: u.eveningTime,
      });
      setNotif(false);
    }
  };

  const onReset = () => {
    Alert.alert("リセット", "すべてのデータを削除します。よろしいですか？", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: async () => {
          await fullLocalWipe();
          router.replace("/welcome");
        } },
    ]);
  };

  const onClearCache = async () => {
    // 解釈文キャッシュ（interp:*）のみ削除
    try {
      const keys = await AsyncStorage.getAllKeys();
      const interpKeys = keys.filter((k) => k.startsWith("interp:"));
      if (interpKeys.length > 0) await AsyncStorage.multiRemove(interpKeys);
      Alert.alert("キャッシュを削除しました", `${interpKeys.length}件のデータを整理しました`);
    } catch (e) {
      Alert.alert("失敗しました", String(e));
    }
  };

  const onExport = async () => {
    const r = await exportUserData();
    if (!r.ok) {
      Alert.alert("エクスポートに失敗しました", r.error || "もう一度お試しください。");
      return;
    }
    Alert.alert("エクスポートしました", "共有画面が開かない場合は、端末の共有先アプリをご確認ください。");
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "アカウントを削除",
      "サーバーとローカルの両方からすべてのデータを完全に削除します。\nこの操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        { text: "削除する", style: "destructive", onPress: async () => {
            const r = await deleteAccount();
            if (!r.ok) {
              Alert.alert("削除に失敗しました", `${r.error || "通信エラー"}\nもう一度お試しください。\nローカルデータは保持されています。`);
              return;
            }
            await performSignOutCleanup();   // ← サインアウト動線と同じ後始末を必ず通す
            await fullLocalWipe();
            router.replace("/welcome");
          } },
      ]
    );
  };

  return (
    <LinearGradient colors={morningGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>各種設定</Text>
            <Text style={s.title}>設定</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Section num="01" title="プロフィール" />
          <Group>
            <Pressable onPress={() => router.push("/edit/nickname")} accessibilityRole="button"><Row label="ニックネーム" value={u.nickname} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/birth")} accessibilityRole="button"><Row label="生年月日" value={u.birthDateProvided ? `${u.birthYear}年${u.birthMonth}月${u.birthDay}日` : "未入力（任意）"} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/place")} accessibilityRole="button"><Row label="生まれた場所" value={u.birthPlace || "未設定"} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/mbti")} accessibilityRole="button"><Row label="MBTI" value={u.mbti || "未設定"} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/blood")} accessibilityRole="button"><Row label="血液型" value={u.bloodType ? (u.bloodType === "unknown" ? "わからない" : `${u.bloodType}型`) : "—"} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/gender")} accessibilityRole="button"><Row label="性別" value={genderLabel(u.gender)} arrow /></Pressable>
            <Pressable onPress={() => router.push("/edit/themes")} accessibilityRole="button"><Row label="関心テーマ" value={`${u.themes.length}つ選択中`} arrow /></Pressable>
          </Group>

          <Section num="02" title="通知" />
          <Group>
            <Pressable onPress={() => router.push("/edit/wakeup")} accessibilityRole="button"><Row label="起床時間" value={u.wakeUpTime} arrow /></Pressable>
            <Row label="通知が届く時刻" value={notifyTimeFrom(u.wakeUpTime)} hint="起床の10分後" />
            <Pressable onPress={() => router.push("/notifications-settings")} accessibilityRole="button"><Row label="通知の設定" value="" arrow /></Pressable>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowKey}>朝の通知を受け取る</Text>
              </View>
              <Switch value={notif} onValueChange={onToggleNotif} trackColor={{ true: C.red, false: "#ccc" }} />
            </View>
          </Group>

          {(() => {
            // 03 以降の番号を動的に振る（サインイン有無で「アカウント」が増減するため）
            let n = 2;
            const next = () => String(++n).padStart(2, "0");
            return (
              <>
                {signedIn && email && (
                  <>
                    <Section num={next()} title="アカウント" />
                    <Group>
                      <Row label="サインイン中" value={email} />
                    </Group>
                  </>
                )}

                <Section num={next()} title="プラン" />
                <Group>
                  {!sub.isPremium && (
                    <Pressable onPress={() => router.push("/premium")} accessibilityRole="button">
                      <Row label="プレミアムをはじめる" value="" arrow />
                    </Pressable>
                  )}
                  <Row label="現在のプラン" value={planLabel} />
                </Group>

                <Section num={next()} title="コンテンツ" />
                <Group>
                  <Pressable onPress={() => router.push("/calendar")} accessibilityRole="button"><Row label="月間カレンダー" value="" arrow /></Pressable>
                  <Pressable onPress={() => router.push("/chart")} accessibilityRole="button"><Row label="傾向メモ" value="" arrow /></Pressable>
                </Group>

                <Section num={next()} title="その他" />
              </>
            );
          })()}
          <Group>
            <Pressable onPress={() => router.push("/help")} accessibilityRole="button"><Row label="よくあるご質問" value="" arrow /></Pressable>
            <Pressable onPress={() => router.push("/legal/terms")} accessibilityRole="button"><Row label="利用規約" value="" arrow /></Pressable>
            <Pressable onPress={() => router.push("/legal/privacy")} accessibilityRole="button"><Row label="プライバシーポリシー" value="" arrow /></Pressable>
            <Pressable onPress={() => router.push("/contact")} accessibilityRole="button"><Row label="お問い合わせ" value="" arrow /></Pressable>
            <Pressable onPress={onExport} accessibilityRole="button"><Row label="データをエクスポート" value="" arrow /></Pressable>
            <Pressable onPress={onClearCache} accessibilityRole="button"><Row label="キャッシュを整理" value="" arrow /></Pressable>
            <Row label="バージョン" value={appVersion} />
          </Group>

          {signedIn && (
            <Pressable style={s.signOut} onPress={onSignOut} accessibilityRole="button">
              <Text style={s.signOutText}>サインアウト</Text>
            </Pressable>
          )}
          {!signedIn && isSupabaseConfigured && (
            <Pressable style={s.signOut} onPress={() => router.push("/(auth)/sign-in")} accessibilityRole="button">
              <Text style={s.signOutText}>サインインしてデータを同期</Text>
            </Pressable>
          )}

          <Pressable style={s.danger} onPress={onReset} accessibilityRole="button">
            <Text style={s.dangerText}>ローカルデータをリセット</Text>
          </Pressable>
          {signedIn && (
            <Pressable style={s.danger} onPress={onDeleteAccount} accessibilityRole="button">
              <Text style={s.dangerText}>アカウントを完全に削除</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
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
function Group({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>;
}
function Row({ label, value, hint, arrow }: { label: string; value: string; hint?: string; arrow?: boolean }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowKey}>{label}</Text>
        {hint && <Text style={s.rowHint}>{hint}</Text>}
      </View>
      <Text style={s.rowVal}>{value}</Text>
      {arrow && <Text style={s.arrow}>›</Text>}
    </View>
  );
}
function genderLabel(g: string | null) {
  return ({ female: "女性", male: "男性", other: "その他", none: "選択しない" } as Record<string, string>)[g || ""] || "—";
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 16 },
  back: { color: C.white, fontSize: 24, fontWeight: "700" },
  dateLabel: { color: "#FFF8EA", fontSize: 11, opacity: 0.96, letterSpacing: 3, fontWeight: "700" },
  title: { color: C.white, fontSize: 24, fontWeight: "800", letterSpacing: 4, marginTop: 4, fontFamily: F.serif },
  content: { paddingHorizontal: 18, paddingBottom: 64 },

  section: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22, marginBottom: 12 },
  sectionNum: { color: "#FFF8EA", fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  sectionLine: { flex: 1, height: 1, backgroundColor: "rgba(255,248,234,0.42)" },
  sectionTitle: { color: "#FFF8EA", fontSize: 13, fontWeight: "800", letterSpacing: 3, fontFamily: F.serif },

  group: { backgroundColor: "#FFF8EA", borderRadius: 14, borderWidth: 1, borderColor: "rgba(126,88,48,0.18)", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "rgba(126,88,48,0.14)", gap: 12 },
  rowKey: { color: C.ink, fontSize: 13, fontWeight: "800" },
  rowHint: { color: C.inkSub, fontSize: 10, marginTop: 2 },
  rowVal: { color: C.inkSub, fontSize: 12 },
  arrow: { color: C.inkMuted, fontSize: 14 },

  signOut: { marginTop: 32, alignItems: "center", padding: 14 },
  signOutText: { color: C.white, fontSize: 13, letterSpacing: 2, fontFamily: F.serif, fontWeight: "800" },
  danger: { marginTop: 8, alignItems: "center", padding: 14 },
  dangerText: { color: "#FFF8EA", fontSize: 12, letterSpacing: 2, fontWeight: "800" },
});
