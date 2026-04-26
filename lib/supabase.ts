/**
 * Supabase クライアント
 *
 * 環境変数 EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を
 * .env または app.json の extra に設定してください。
 *
 * 未設定でもアプリはオフラインモードで動作します。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { errorMessage, userCancelled } from "./errors";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// ============================================================
// 型定義（DB スキーマと同期）
// ============================================================
export type DbUser = {
  id: string;
  auth_id: string;
  nickname: string;
  birth_date: string;
  birth_place: string;
  mbti: string | null;
  blood_type: string | null;
  gender: string | null;
  wake_up_time: string;
  themes: string[];
  year_pillar: string;
  month_pillar: string;
  day_pillar: string;
  created_at: string;
  updated_at: string;
};

export type DbInterpretation = {
  id: string;
  user_day_pillar: string;
  target_day_pillar: string;
  kichi: "大吉" | "中吉" | "小吉" | "末吉" | "凶";
  score: number;
  headline: string;
  body: string;
  do_actions: string[];
  avoid_actions: string[];
  lucky_item: string;
  lucky_color: string;
  lucky_direction: string;
  lucky_food: string;
  lucky_sound: string;
  lucky_number: string;
  version: number;
  generated_at: string;
};

// ============================================================
// 認証ヘルパー（実機ビルドでのみ動作・Expo Goでは利用不可）
// ============================================================

export async function signInWithApple(): Promise<{ error?: string; userId?: string; email?: string; fullName?: string }> {
  if (!supabase) return { error: "Supabase未設定" };
  try {
    const AppleAuthentication = await import("expo-apple-authentication");
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return { error: "Apple ID から identityToken を取得できませんでした" };
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
    });
    if (error) return { error: error.message };
    // 初回のみ name/email が返ってくる（次回からは null）
    const fullName = [credential.fullName?.familyName, credential.fullName?.givenName]
      .filter(Boolean).join(" ") || undefined;
    return {
      userId: data.user?.id,
      email: credential.email || data.user?.email,
      fullName,
    };
  } catch (e: unknown) {
    if (userCancelled(e)) return { error: "サインインがキャンセルされました" };
    return { error: errorMessage(e) };
  }
}

/**
 * Google Sign-in（expo-auth-session 使用）
 *
 * 必要な設定:
 *   1. Google Cloud Console で OAuth 2.0 クライアント ID を3つ作成 (iOS / Android / Web)
 *   2. EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS / _ANDROID / _WEB を設定
 *   3. iOS Info.plist に CFBundleURLSchemes を追加
 *
 * ⚠️ Expo Go では動作しません（ExpoCryptoAES 必要）。EAS Build で動作。
 */
export async function signInWithGoogle(): Promise<{ error?: string; userId?: string }> {
  if (!supabase) return { error: "Supabase未設定" };

  try {
    const AuthSession = await import("expo-auth-session");
    const { Platform } = await import("react-native");
    const GOOGLE_CLIENT_ID =
      Platform.OS === "ios"     ? process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS
      : Platform.OS === "android" ? process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID
      : process.env.EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB;
    if (!GOOGLE_CLIENT_ID) return { error: "Google Client ID 未設定" };

    const redirectUri = AuthSession.makeRedirectUri({ scheme: "asakizashi" });
    const discovery = await AuthSession.fetchDiscoveryAsync("https://accounts.google.com");
    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: { nonce: Math.random().toString(36).slice(2) },
    });
    const result = await request.promptAsync(discovery);
    if (result.type !== "success") return { error: "サインインがキャンセルされました" };

    const idToken = (result.params as any).id_token as string | undefined;
    if (!idToken) return { error: "id_token を取得できませんでした" };

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    if (error) return { error: error.message };
    return { userId: data.user?.id };
  } catch (e: unknown) {
    return { error: errorMessage(e) };
  }
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
  // dynamic import で循環依存回避
  const { setUserId } = await import("./analytics");
  const { setUser } = await import("./sentry");
  setUserId(null);
  setUser(null);
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * アカウント完全削除（GDPR / App Store 必須）
 *
 * delete-account Edge Function に「全てを任せる」設計:
 *   - クライアントは soft delete を直接呼ばない（中途半端な状態の発生源だった）
 *   - Edge Function 内で users.deleted_at 更新 → auth.users 削除を順次実行
 *   - 途中失敗時は ok: false で戻り、ローカルは保持
 *
 * 成功時のみローカルセッションをクリアし、呼び出し側はその後ローカルワイプを実行する。
 */
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: true }; // ローカルのみ運用なら OK
  try {
    const session = await getSession();
    if (!session) return { ok: true };

    const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    const res = await fetch(`${url}/functions/v1/delete-account`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (!res.ok) {
      // Edge Function がエラーレスポンスを返した（部分削除の心配なし: server 側で完結する設計）
      let detail = `${res.status}`;
      try {
        const body = (await res.json()) as { code?: string; message?: string };
        if (body?.message) detail = `${body.code ?? res.status}: ${body.message}`;
      } catch {
        const text = await res.text().catch(() => "");
        if (text) detail = `${res.status}: ${text}`;
      }
      return { ok: false, error: `アカウント削除に失敗しました (${detail})` };
    }

    // サーバー側削除成功 → ローカルセッションをクリア（呼び出し側が fullLocalWipe を続けて実行）
    await supabase.auth.signOut();
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}

// ============================================================
// データ操作（型安全ラッパー）
// ============================================================
export async function fetchInterpretation(
  userDayPillar: string,
  targetDayPillar: string,
  version: number = 1
): Promise<DbInterpretation | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("interpretations")
    .select("*")
    .eq("user_day_pillar", userDayPillar)
    .eq("target_day_pillar", targetDayPillar)
    .eq("version", version)
    .single();
  if (error) {
    console.warn("fetchInterpretation:", error.message);
    return null;
  }
  return data as DbInterpretation;
}

export async function syncUserProfile(profile: Partial<DbUser>): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("users").upsert(profile, { onConflict: "auth_id" });
  if (error) console.warn("syncUserProfile:", error.message);
}
