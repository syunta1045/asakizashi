/**
 * 振り返り日記
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { track } from "./analytics";

export type Mood = 0 | 1 | 2 | 3; // 0=とても良い, 1=ふつう, 2=もやもや, 3=つらい

export const MOOD_LABELS = ["とても良い", "ふつう", "もやもや", "つらい"] as const;
export const MOOD_MARKS = ["◎", "○", "△", "✕"] as const;

export type JournalEntry = {
  date: string; // YYYY-MM-DD
  mood: Mood;
  note: string;
};

type JournalState = {
  entries: Record<string, JournalEntry>;
  upsert: (date: string, mood: Mood, note: string) => void;
  remove: (date: string) => void;
  reset: () => void;
  getStreak: () => number;
};

export const useJournal = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: {},
      upsert: (date, mood, note) => {
        track("journal_entry_saved", { date, mood, hasNote: note.length > 0 });
        set((s) => ({ entries: { ...s.entries, [date]: { date, mood, note } } }));
      },
      remove: (date) =>
        set((s) => {
          const { [date]: _, ...rest } = s.entries;
          return { entries: rest };
        }),
      reset: () => set({ entries: {} }),
      getStreak: () => {
        const entries = get().entries;
        if (Object.keys(entries).length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; ; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          // ローカル時刻ベース YYYY-MM-DD
          const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          if (entries[k]) streak++;
          else break;
        }
        return streak;
      },
    }),
    { name: "asakizashi-journal", storage: createJSONStorage(() => AsyncStorage) }
  )
);

export function todayKey(): string {
  // ローカル時刻ベースの YYYY-MM-DD（toISOString は UTC で日付がズレる）
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const;

export type Milestone = {
  days: number;
  title: string;
  description: string;
};

export function nextMilestone(streak: number): Milestone | null {
  const next = MILESTONES.find((m) => m > streak);
  if (!next) return null;
  return {
    days: next,
    title: milestoneTitle(next),
    description: `あと${next - streak}日で${next}日達成`,
  };
}

export function reachedMilestone(streak: number): Milestone | null {
  if (!(MILESTONES as readonly number[]).includes(streak)) return null;
  return {
    days: streak,
    title: milestoneTitle(streak),
    description: `${streak}日連続で旭兆と過ごしています`,
  };
}

/**
 * 今日の振り返りが未記入かどうか
 */
export function isTodayMissing(entries: Record<string, JournalEntry>): boolean {
  return !entries[todayKey()];
}

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 過去N日間の気分集計
 */
export function moodStats(entries: Record<string, JournalEntry>, days: number = 30): { counts: number[]; total: number } {
  const counts = [0, 0, 0, 0]; // 0=とても良い, 1=ふつう, 2=もやもや, 3=つらい
  const today = new Date();
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    if (e) {
      counts[e.mood]++;
      total++;
    }
  }
  return { counts, total };
}

/** 過去N日の平均気分。Mood は 0=最良 ... 3=最悪 なので 0〜3 の小数を返す */
export function moodAverage(entries: Record<string, JournalEntry>, days: number = 30): { avg: number; total: number } {
  const today = new Date();
  let sum = 0;
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    if (e) {
      sum += e.mood;
      total++;
    }
  }
  return { avg: total > 0 ? sum / total : 0, total };
}

/** 直近7日 vs その前7日 の気分平均の差（マイナス = 改善、プラス = 悪化）*/
export function moodTrend(entries: Record<string, JournalEntry>): { current: number; previous: number; diff: number; currentN: number; previousN: number } {
  const today = new Date();
  let curSum = 0, curN = 0, prevSum = 0, prevN = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    if (e) { curSum += e.mood; curN++; }
  }
  for (let i = 7; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    if (e) { prevSum += e.mood; prevN++; }
  }
  const current = curN > 0 ? curSum / curN : 0;
  const previous = prevN > 0 ? prevSum / prevN : 0;
  return { current, previous, diff: current - previous, currentN: curN, previousN: prevN };
}

/** 曜日別の平均気分（日=0 〜 土=6）*/
export function moodByWeekday(entries: Record<string, JournalEntry>, days: number = 30): { sums: number[]; counts: number[] } {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    if (e) {
      const w = d.getDay();
      sums[w] += e.mood;
      counts[w]++;
    }
  }
  return { sums, counts };
}

/** 直近 N 日の気分配列（古→新）。記録なしは null */
export function moodSparkline(entries: Record<string, JournalEntry>, days: number = 14): (Mood | null)[] {
  const today = new Date();
  const out: (Mood | null)[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const e = entries[localKey(d)];
    out.push(e ? e.mood : null);
  }
  return out;
}

/** 過去 N 日内の最長連続記録 */
export function longestStreakInRange(entries: Record<string, JournalEntry>, days: number = 30): number {
  const today = new Date();
  let max = 0, cur = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (entries[localKey(d)]) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 0;
    }
  }
  return max;
}

function milestoneTitle(days: number): string {
  if (days >= 365) return "一年の旅人";
  if (days >= 100) return "百日の見守り";
  if (days >= 60) return "二月の継続者";
  if (days >= 30) return "ひと月の習慣";
  if (days >= 14) return "二週の継続";
  if (days >= 7) return "一週間の節目";
  return "三日の芽生え";
}
