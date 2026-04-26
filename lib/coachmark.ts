/**
 * 初回コーチマーク表示状態
 * AsyncStorage に保存し、一度見たら表示しない
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CoachKey = "today_intro" | "ranking_intro" | "relations_intro";

type CoachState = {
  seen: Record<CoachKey, boolean>;
  markSeen: (k: CoachKey) => void;
  reset: () => void;
};

export const useCoachmark = create<CoachState>()(
  persist(
    (set) => ({
      seen: {
        today_intro: false,
        ranking_intro: false,
        relations_intro: false,
      },
      markSeen: (k) => set((s) => ({ seen: { ...s.seen, [k]: true } })),
      reset: () => set({ seen: { today_intro: false, ranking_intro: false, relations_intro: false } }),
    }),
    { name: "asakizashi-coachmark", storage: createJSONStorage(() => AsyncStorage) }
  )
);
