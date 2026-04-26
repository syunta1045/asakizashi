import { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signInWithApple, signInWithGoogle, isSupabaseConfigured } from "../../lib/supabase";
import { syncOnSignIn } from "../../lib/sync";
import { ensureRevenueCatConfigured } from "../../lib/revenuecat";
import { useUser } from "../../lib/store";
import { track } from "../../lib/analytics";
import { haptics } from "../../lib/haptics";
import { C, dawnGradient, F } from "../../lib/theme";

/**
 * Apple Sign-in ボタンを動的ロード（Expo Go ではネイティブモジュール無し）
 */
function AppleSignInButton({ onPress }: { onPress: () => void }) {
  const [Btn, setBtn] = useState<any>(null);
  useEffect(() => {
    import("expo-apple-authentication").then((m) => setBtn(() => m.AppleAuthenticationButton)).catch(() => {});
  }, []);
  if (!Btn) return null;
  // Type は any にして const を経由
  return (
    <Btn
      buttonType={0 /* SIGN_IN */}
      buttonStyle={2 /* WHITE_OUTLINE */}
      cornerRadius={24}
      style={{ width: "100%", height: 52 }}
      onPress={onPress}
    />
  );
}

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      // Expo Go では native module が無いので動的ロード
      import("expo-apple-authentication")
        .then((m) => m.isAvailableAsync().then(setAppleAvailable))
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  const onAppleSignIn = async () => {
    haptics.light();
    track("sign_in_attempted", { provider: "apple" });
    if (!isSupabaseConfigured) {
      Alert.alert(
        "オフラインモード",
        "サーバー連携が未設定のため、ローカル保存のみで進めます。"
      );
      router.replace("/(onboarding)/name");
      return;
    }
    setLoading(true);
    const result = await signInWithApple();
    if (result.error) {
      setLoading(false);
      Alert.alert("サインインできませんでした", result.error);
      return;
    }
    track("sign_in_succeeded", { provider: "apple" });
    // 初回のみ Apple から名前が取れた場合は nickname のシード値に
    if (result.fullName && !useUser.getState().nickname) {
      useUser.getState().setField("nickname", result.fullName);
    }
    // サーバーから pull / push
    const sync = await syncOnSignIn();
    setLoading(false);
    if (!sync.ok) {
      // 通信エラー等で同期に失敗 → オンボへ進める前にユーザーに知らせて中断
      Alert.alert("同期に失敗しました", `${sync.error || "通信エラー"}\nもう一度お試しください。`);
      return;
    }
    haptics.success();
    const onboarded = useUser.getState().isOnboarded;
    router.replace(onboarded ? "/today" : "/(onboarding)/name");
  };

  const onGoogleSignIn = async () => {
    haptics.light();
    track("sign_in_attempted", { provider: "google" });
    if (!isSupabaseConfigured) {
      Alert.alert("オフラインモード", "サーバー連携が未設定です。");
      router.replace("/(onboarding)/name");
      return;
    }
    setLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      setLoading(false);
      Alert.alert("サインインできませんでした", result.error);
      return;
    }
    track("sign_in_succeeded", { provider: "google" });
    const sync = await syncOnSignIn();
    setLoading(false);
    if (!sync.ok) {
      Alert.alert("同期に失敗しました", `${sync.error || "通信エラー"}\nもう一度お試しください。`);
      return;
    }
    // RevenueCat を新しい userId で初期化（未設定なら no-op）
    ensureRevenueCatConfigured().catch(() => {});
    haptics.success();
    const onboarded = useUser.getState().isOnboarded;
    router.replace(onboarded ? "/today" : "/(onboarding)/name");
  };

  return (
    <LinearGradient colors={dawnGradient as unknown as [string, string, ...string[]]} style={s.bg}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="戻る" hitSlop={12}><Text style={s.back}>‹</Text></Pressable>
        </View>

        <View style={s.center}>
          <Text style={s.brand}>旭兆</Text>
          <Text style={s.lede}>
            毎朝のお告げを、{"\n"}どの端末でも受け取るために
          </Text>
        </View>

        <View style={s.bottom}>
          {Platform.OS === "ios" && appleAvailable && !loading && (
            <AppleSignInButton onPress={onAppleSignIn} />
          )}
          {loading && (
            <View style={[s.appleBtn, { alignItems: "center", justifyContent: "center" }]}>
              <ActivityIndicator color={C.white} />
            </View>
          )}

          {!loading && (
            <Pressable style={s.googleBtn} onPress={onGoogleSignIn} accessibilityRole="button">
              <Text style={s.googleBtnText}>Google で続ける</Text>
            </Pressable>
          )}

          <Pressable
            style={s.skip}
            onPress={() => { haptics.light(); router.replace("/(onboarding)/name"); }}
          accessibilityRole="button">
            <Text style={s.skipText}>サインインせずに使う</Text>
          </Pressable>
          <Text style={s.note}>
            あとから設定で連携できます{"\n"}
            ローカルに保存されたデータは他の端末で見られません
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28 },
  header: { flexDirection: "row", paddingTop: 8 },
  back: { color: C.white, fontSize: 22 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: { color: C.white, fontSize: 56, letterSpacing: 16, fontFamily: F.serif, fontWeight: "500", lineHeight: 60 },
  lede: { color: C.white, fontSize: 14, lineHeight: 26, marginTop: 28, textAlign: "center", opacity: 0.9, fontFamily: F.serif },
  bottom: { paddingBottom: 30, gap: 12 },
  appleBtn: { width: "100%", height: 52 },
  googleBtn: { width: "100%", height: 52, borderRadius: 24, backgroundColor: C.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.gold },
  googleBtnText: { color: C.ink, fontSize: 14, fontWeight: "600" },
  skip: { paddingVertical: 14, alignItems: "center" },
  skipText: { color: C.white, fontSize: 13, opacity: 0.85, fontFamily: F.serif },
  note: { color: C.white, fontSize: 10, opacity: 0.7, textAlign: "center", lineHeight: 18 },
});
