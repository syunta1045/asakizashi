/**
 * オンボーディング/ユーザー状態（Zustand）
 * MVP: ローカル保持のみ。後で Supabase と同期。
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { threePillars, pillarToString, type ThreePillars } from "./bazi";

export type UserProfile = {
  nickname: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthPlace: string;
  mbti: string | null;
  bloodType: "A" | "B" | "O" | "AB" | "unknown" | null;
  gender: "female" | "male" | "other" | "none" | null;
  wakeUpTime: string;        // "06:30"
  themes: string[];          // 最大3
  // 通知設定
  morningEnabled: boolean;   // 朝のお告げ
  eveningEnabled: boolean;   // 夜の振り返りリマインダー
  eveningTime: string;       // "21:00"
};

export type UserState = UserProfile & {
  // 算出値
  pillars: ThreePillars | null;
  dayPillarStr: string;      // 例: "戊午"
  // ナビゲーション状態
  isOnboarded: boolean;

  // actions
  setField: <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => void;
  computePillars: () => void;
  finishOnboarding: () => void;
  reset: () => void;
};

const DEFAULTS: UserProfile = {
  nickname: "",
  birthYear: 1998,
  birthMonth: 7,
  birthDay: 12,
  birthPlace: "東京都",
  mbti: null,
  bloodType: null,
  gender: null,
  wakeUpTime: "06:30",
  themes: [],
  morningEnabled: true,
  eveningEnabled: true,
  eveningTime: "21:00",
};

export const useUser = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      pillars: null,
      dayPillarStr: "",
      isOnboarded: false,

      setField: (k, v) => {
        set({ [k]: v } as Partial<UserState>);
        // 既ログインなら sync layer の onProfileChanged コールバックを呼ぶ（800ms デバウンスで連打を吸収）
        if (get().isOnboarded && onProfileChanged) {
          schedulePush();
        }
      },

      computePillars: () => {
        const { birthYear, birthMonth, birthDay } = get();
        const date = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
        const p = threePillars(date);
        set({ pillars: p, dayPillarStr: pillarToString(p.day) });
      },

      finishOnboarding: () => set({ isOnboarded: true }),

      reset: () => set({ ...DEFAULTS, pillars: null, dayPillarStr: "", isOnboarded: false }),
    }),
    {
      name: "asakizashi-user",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================================
// プロフィール変更時のサイドエフェクト注入
// （sync.ts が registerProfileChangeHandler を呼ぶことで
//  循環依存なしにサーバー push を発火できる）
// ============================================================
let onProfileChanged: (() => Promise<void>) | null = null;
export function registerProfileChangeHandler(fn: () => Promise<void>) {
  onProfileChanged = fn;
}

// setField 連打を 800ms 単位でまとめて 1 回だけ push
let pushTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    onProfileChanged?.().catch(() => {});
  }, 800);
}

// 通知時刻 = 起床時刻 + 10分
export function notifyTimeFrom(wakeUp: string): string {
  const [h, m] = wakeUp.split(":").map(Number);
  const total = h * 60 + m + 10;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
