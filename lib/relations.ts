/**
 * つながり（人・推し・ペット・大切な日 など）の状態管理
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { threePillars, type ThreePillars } from "./bazi";
import { branchCompatibility, type CompatKind } from "./compatibility";

export type Genre =
  | "person" | "oshi" | "work" | "key_day" | "pet" | "first_meet" | "past" | "place";

export const GENRE_INFO: Record<Genre, { icon: string; label: string; sub: string; color: string }> = {
  person:     { icon: "✦", label: "大切な人",      sub: "家族・恋人・友人",   color: "#A8B89E" },
  oshi:       { icon: "★", label: "推し",          sub: "アイドル・俳優",     color: "#E8B4B8" },
  work:       { icon: "▲", label: "仕事の関係",     sub: "上司・取引先",       color: "#9B8FC4" },
  key_day:    { icon: "◆", label: "大切な日",      sub: "結婚・転職・開業",   color: "#C26E70" },
  pet:        { icon: "❀", label: "ペット",        sub: "犬・猫など",         color: "#A88340" },
  first_meet: { icon: "◯", label: "これから会う人",  sub: "初対面・お見合い",   color: "#7BA88C" },
  past:       { icon: "✿", label: "過去の人",      sub: "元恋人・故人",       color: "#8E6F8E" },
  place:      { icon: "▢", label: "場所",          sub: "創業日のあるもの",   color: "#7E8B9E" },
};

export type Relation = {
  id: string;
  genre: Genre;
  label: string;       // "夫" / "アイドル" / "結婚した日" 等
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  pillars: ThreePillars;
  createdAt: number;
};

/** 無料プランの登録上限。FEATURE_LOCKS.relations.freeLimit と一致させる */
export const FREE_RELATION_LIMIT = 5;

export class RelationLimitError extends Error {
  constructor() {
    super(`無料プランでは${FREE_RELATION_LIMIT}件までしか登録できません`);
    this.name = "RelationLimitError";
  }
}

type RelationsState = {
  list: Relation[];
  /** isPremium=false のとき件数上限を超えたら RelationLimitError を throw */
  add: (r: Omit<Relation, "id" | "pillars" | "createdAt">, isPremium?: boolean) => Relation;
  remove: (id: string) => void;
  reset: () => void;
};

export const useRelations = create<RelationsState>()(
  persist(
    (set, get) => ({
      list: [],

      add: (r, isPremium = false) => {
        if (!isPremium && get().list.length >= FREE_RELATION_LIMIT) {
          throw new RelationLimitError();
        }
        const date = new Date(Date.UTC(r.birthYear, r.birthMonth - 1, r.birthDay));
        const pillars = threePillars(date);
        const created: Relation = {
          ...r,
          id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          pillars,
          createdAt: Date.now(),
        };
        set((s) => ({ list: [created, ...s.list] }));
        return created;
      },

      remove: (id) => set((s) => ({ list: s.list.filter((r) => r.id !== id) })),
      reset: () => set({ list: [] }),
    }),
    { name: "asakizashi-relations", storage: createJSONStorage(() => AsyncStorage) }
  )
);

// ============================================================
// 相性判定は lib/compatibility.ts に統一。後方互換のため re-export。
// ============================================================
export { branchCompatibility as compatibility, type CompatKind };
