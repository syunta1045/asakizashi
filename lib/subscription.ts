/**
 * 課金状態の管理
 * MVP: ローカルフラグのみ。本番は RevenueCat で entitlement 判定。
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { track } from "./analytics";

export type Plan = "free" | "premium_monthly" | "premium_yearly" | "trial";

type SubscriptionState = {
  plan: Plan;
  isPremium: boolean;
  trialStartedAt: number | null;     // ms epoch
  setPlan: (p: Plan) => void;
  startTrial: () => void;
  cancelToFree: () => void;
  reset: () => void;
  /** RevenueCat entitlement の現在値をローカル表示へ反映する */
  applyEntitlement: (active: boolean, plan?: Extract<Plan, "premium_monthly" | "premium_yearly">) => void;
  /** トライアル期限切れなら自動で free に落とす。アプリ起動時 / 復帰時に呼ぶ */
  checkTrialExpiry: () => void;
};

const TRIAL_MS = 7 * 24 * 60 * 60 * 1000; // 7日
const DAY_MS = 24 * 60 * 60 * 1000;

function trialIsLive(plan: Plan, trialStartedAt: number | null): boolean {
  if (plan !== "trial" || !trialStartedAt) return false;
  const elapsed = Date.now() - trialStartedAt;
  if (elapsed < 0) return true; // 端末時計の逆行
  return elapsed < TRIAL_MS;
}

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: "free",
      isPremium: false,
      trialStartedAt: null,

      setPlan: (p) => set({ plan: p, isPremium: p !== "free" }),

      startTrial: () => {
        track("trial_started");
        set({ plan: "trial", isPremium: true, trialStartedAt: Date.now() });
      },

      cancelToFree: () => set({ plan: "free", isPremium: false }),

      reset: () => set({ plan: "free", isPremium: false, trialStartedAt: null }),

      applyEntitlement: (active, entitlementPlan) => {
        const s = get();
        if (active) {
          const plan =
            entitlementPlan ??
            (s.plan === "premium_monthly" || s.plan === "premium_yearly" ? s.plan : "premium_monthly");
          set({
            plan,
            isPremium: true,
            trialStartedAt: null,
          });
          return;
        }
        if (s.plan === "premium_monthly" || s.plan === "premium_yearly") {
          set({ plan: "free", isPremium: false });
        }
      },

      checkTrialExpiry: () => {
        const s = get();
        if (s.plan === "trial" && !trialIsLive(s.plan, s.trialStartedAt)) {
          set({ plan: "free", isPremium: false });
        }
      },
    }),
    {
      name: "asakizashi-subscription",
      storage: createJSONStorage(() => AsyncStorage),
      // 永続化からの復元直後に期限切れチェック（古い isPremium=true を放置しない）
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.plan === "trial" && !trialIsLive(state.plan, state.trialStartedAt)) {
          state.plan = "free";
          state.isPremium = false;
        }
      },
    }
  )
);

export function isTrialActive(s: SubscriptionState): boolean {
  return trialIsLive(s.plan, s.trialStartedAt);
}

/**
 * トライアル残日数（暦日ベース、最低 0、最大 7）。
 * 「残り 1 日」と表示中はその日いっぱい有効、0 日になったら expire 扱い。
 */
export function trialDaysRemaining(s: SubscriptionState): number {
  if (!isTrialActive(s) || !s.trialStartedAt) return 0;
  const elapsed = Math.max(0, Date.now() - s.trialStartedAt);
  const remainMs = TRIAL_MS - elapsed;
  return Math.max(0, Math.min(7, Math.ceil(remainMs / DAY_MS)));
}

// ============================================================
// 機能ロックフラグ
// ============================================================
export const FEATURE_LOCKS = {
  chartDetail: { premium: true,  freeLimit: 0 },
  monthCalendar: { premium: true, freeLimit: 0 },
  fiveElements: { premium: true, freeLimit: 0 },
  relations: { premium: false, freeLimit: 5 },
  customNotificationTime: { premium: true, freeLimit: 0 },
  sixLuckyItems: { premium: true, freeLimit: 3 },
} as const;

export type FeatureKey = keyof typeof FEATURE_LOCKS;

export function isLocked(feature: FeatureKey, isPremium: boolean): boolean {
  const f = FEATURE_LOCKS[feature];
  return f.premium && !isPremium;
}
