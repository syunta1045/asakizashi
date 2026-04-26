/**
 * RevenueCat クライアントラッパー
 *
 * インストール:
 *   npm install react-native-purchases react-native-purchases-ui --legacy-peer-deps
 *
 * セットアップ:
 *   1. RevenueCat ダッシュボードで App / Product / Entitlement を作成
 *   2. EXPO_PUBLIC_REVENUECAT_IOS_KEY と EXPO_PUBLIC_REVENUECAT_ANDROID_KEY を設定
 *   3. configureRevenueCat(userId) を起動時に呼ぶ
 */
import { Platform } from "react-native";
import { errorMessage, userCancelled } from "./errors";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const ENTITLEMENT_ID = "premium";

export const isRevenueCatConfigured = Boolean(
  Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY
);

let configured = false;

// react-native-purchases が未インストールでも型エラーにならないよう any で受ける
async function loadPurchases(): Promise<any | null> {
  try {
    return (await import("react-native-purchases" as any)).default;
  } catch {
    return null;
  }
}

export async function configureRevenueCat(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isRevenueCatConfigured) return { ok: false, error: "未設定" };
  if (configured) return { ok: true };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, error: "react-native-purchases 未インストール" };
  try {
    const apiKey = Platform.OS === "ios" ? IOS_KEY! : ANDROID_KEY!;
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * セッションがあれば RevenueCat を初期化する一発呼び出し。
 * - 起動直後のセッション復元後 / サインイン成功後に呼ぶ
 * - 何度呼んでも 1 回だけ Purchases.configure する（idempotent）
 * - RevenueCat 未設定 / SDK 未導入 / 未ログイン いずれの場合も無害（throw しない）
 */
export async function ensureRevenueCatConfigured(): Promise<{ ok: boolean; error?: string }> {
  if (!isRevenueCatConfigured) return { ok: false, error: "未設定" };
  if (configured) return { ok: true };
  try {
    // 循環依存回避のため動的 import
    const { getSession } = await import("./supabase");
    const session = await getSession();
    if (!session) return { ok: false, error: "未ログイン" };
    return await configureRevenueCat(session.user.id);
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * サインアウト時に呼び出す。次のサインインで別ユーザーIDで再設定できるようにする。
 * Purchases.logOut は試みるが、失敗・未導入でも黙って無視する。
 */
export async function resetRevenueCat(): Promise<void> {
  configured = false;
  if (!isRevenueCatConfigured) return;
  try {
    const Purchases = await loadPurchases();
    if (Purchases?.logOut) await Purchases.logOut();
  } catch {
    // ignore
  }
}

export async function getOfferings(): Promise<unknown | null> {
  if (!configured) return null;
  const Purchases = await loadPurchases();
  if (!Purchases) return null;
  try {
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!configured) return { ok: false, error: "未設定" };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, error: "未インストール" };
  try {
    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e: unknown) {
    if (userCancelled(e)) return { ok: false, error: "キャンセルされました" };
    return { ok: false, error: errorMessage(e) };
  }
}

export async function checkEntitlement(): Promise<boolean> {
  if (!configured) return false;
  const Purchases = await loadPurchases();
  if (!Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; isPremium: boolean }> {
  if (!configured) return { ok: false, isPremium: false };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, isPremium: false };
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, isPremium: Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]) };
  } catch {
    return { ok: false, isPremium: false };
  }
}
