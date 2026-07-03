/**
 * RevenueCat クライアントラッパー
 *
 * インストール:
 *   npm install react-native-purchases react-native-purchases-ui --legacy-peer-deps
 *
 * セットアップ:
 *   1. RevenueCat ダッシュボードで App / Product / Entitlement を作成
 *   2. EXPO_PUBLIC_REVENUECAT_IOS_KEY と EXPO_PUBLIC_REVENUECAT_ANDROID_KEY を設定
 *   3. ensureRevenueCatConfigured() を起動時に呼ぶ
 */
import { Platform } from "react-native";
import { errorMessage, userCancelled } from "./errors";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const ENTITLEMENT_ID = "premium";

export type RevenueCatPlan = "premium_monthly" | "premium_yearly";

export const isRevenueCatConfigured = Boolean(
  Platform.OS === "ios" ? IOS_KEY : ANDROID_KEY
);

let configured = false;
let configuredUserId: string | null = null;

// react-native-purchases が未インストールでも型エラーにならないよう any で受ける
async function loadPurchases(): Promise<any | null> {
  try {
    return (await import("react-native-purchases" as any)).default;
  } catch {
    return null;
  }
}

export async function configureRevenueCat(userId?: string): Promise<{ ok: boolean; error?: string }> {
  if (!isRevenueCatConfigured) return { ok: false, error: "未設定" };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, error: "react-native-purchases 未インストール" };
  try {
    if (configured) {
      if (userId && configuredUserId !== userId && Purchases.logIn) {
        await Purchases.logIn(userId);
        configuredUserId = userId;
      }
      return { ok: true };
    }

    const apiKey = Platform.OS === "ios" ? IOS_KEY! : ANDROID_KEY!;
    Purchases.configure(userId ? { apiKey, appUserID: userId } : { apiKey });
    configured = true;
    configuredUserId = userId ?? null;
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}

/**
 * セッションがあれば RevenueCat を初期化する一発呼び出し。
 * - 起動直後 / サインイン成功後に呼ぶ
 * - 未ログインなら匿名ID、ログイン済みなら Supabase user.id に紐付ける
 * - RevenueCat 未設定 / SDK 未導入 いずれの場合も無害（throw しない）
 */
export async function ensureRevenueCatConfigured(): Promise<{ ok: boolean; error?: string }> {
  if (!isRevenueCatConfigured) return { ok: false, error: "未設定" };
  try {
    // 循環依存回避のため動的 import
    const { getSession } = await import("./supabase");
    const session = await getSession();
    return await configureRevenueCat(session?.user.id);
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
  configuredUserId = null;
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

/**
 * intro オファー（7日無料）の適格性。Apple 仕様で intro は1ユーザー1回のため、
 * 再加入者に「7日間無料」と表示しないための判定。
 * true=適格 / false=不適格 / null=判定不能（表示は現行文言にフォールバック）
 */
export async function checkIntroEligibility(productIdentifier: string): Promise<boolean | null> {
  if (!configured || Platform.OS !== "ios") return null;
  const Purchases = await loadPurchases();
  if (!Purchases?.checkTrialOrIntroductoryPriceEligibility) return null;
  try {
    const map = await Purchases.checkTrialOrIntroductoryPriceEligibility([productIdentifier]);
    const status = map?.[productIdentifier]?.status;
    // 0=UNKNOWN, 1=INELIGIBLE, 2=ELIGIBLE, 3=NO_INTRO_OFFER_EXISTS
    if (status === 2) return true;
    if (status === 1 || status === 3) return false;
    return null;
  } catch {
    return null;
  }
}

export function planFromProductIdentifier(identifier: unknown): RevenueCatPlan | undefined {
  if (typeof identifier !== "string") return undefined;
  if (/(premium_yearly|year|annual|yearly|annually)/i.test(identifier)) return "premium_yearly";
  if (/(premium_monthly|month|monthly)/i.test(identifier)) return "premium_monthly";
  return undefined;
}

function planFromPackage(pkg: any): RevenueCatPlan | undefined {
  return planFromProductIdentifier([
    pkg?.identifier,
    pkg?.packageType,
    pkg?.product?.identifier,
    pkg?.product?.subscriptionPeriod,
  ].filter(Boolean).join(" "));
}

function activePlanFromCustomerInfo(info: any): RevenueCatPlan | undefined {
  const entitlement = info?.entitlements?.active?.[ENTITLEMENT_ID];
  return planFromProductIdentifier(
    entitlement?.productIdentifier ??
    entitlement?.product?.identifier ??
    entitlement?.productId
  );
}

export async function purchasePackage(pkg: unknown): Promise<{ ok: boolean; isPremium: boolean; plan?: RevenueCatPlan; error?: string }> {
  if (!configured) return { ok: false, isPremium: false, error: "未設定" };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, isPremium: false, error: "未インストール" };
  try {
    const result = await Purchases.purchasePackage(pkg);
    const info = result?.customerInfo ?? await Purchases.getCustomerInfo?.();
    const isPremium = Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
    return {
      ok: true,
      isPremium,
      plan: isPremium ? activePlanFromCustomerInfo(info) ?? planFromPackage(pkg) : undefined,
    };
  } catch (e: unknown) {
    if (userCancelled(e)) return { ok: false, isPremium: false, error: "キャンセルされました" };
    return { ok: false, isPremium: false, error: errorMessage(e) };
  }
}

export async function checkEntitlement(): Promise<boolean> {
  const result = await checkEntitlementState();
  return result.active;
}

/**
 * failed=true は「確認できなかった」（オフライン・RC障害）であり「非加入」ではない。
 * 呼び出し側は failed のとき降格処理をスキップし、直前のローカル状態を維持すること。
 */
export async function checkEntitlementState(): Promise<{ active: boolean; plan?: RevenueCatPlan; failed?: boolean }> {
  if (!configured) return { active: false };
  const Purchases = await loadPurchases();
  if (!Purchases) return { active: false };
  try {
    const info = await Purchases.getCustomerInfo();
    const active = Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
    return {
      active,
      plan: active ? activePlanFromCustomerInfo(info) : undefined,
    };
  } catch {
    return { active: false, failed: true };
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; isPremium: boolean; plan?: RevenueCatPlan }> {
  if (!configured) return { ok: false, isPremium: false };
  const Purchases = await loadPurchases();
  if (!Purchases) return { ok: false, isPremium: false };
  try {
    const info = await Purchases.restorePurchases();
    const isPremium = Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
    return {
      ok: true,
      isPremium,
      plan: isPremium ? activePlanFromCustomerInfo(info) : undefined,
    };
  } catch {
    return { ok: false, isPremium: false };
  }
}
