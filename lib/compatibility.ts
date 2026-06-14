/**
 * 干支の相性ロジック（統一版）
 *
 * これまで relations.ts / calendar.ts / pace.ts に散在していた
 * 三合・六合・冲・五行相生/相剋 のテーブルと判定関数をここに集約。
 *
 * 用語:
 *   三合 (sango)      : 申子辰 / 巳酉丑 / 寅午戌 / 亥卯未 — 互いを高め合う三角関係
 *   六合 (rikugo)     : 子丑 / 寅亥 / 卯戌 / 辰酉 / 巳申 / 午未 — 穏やかに支え合う対
 *   冲 (chu)          : 子午 / 丑未 / 寅申 / 卯酉 / 辰戌 / 巳亥 — 正反対、緊張関係
 *   五行相生 (gen)    : 木→火→土→金→水→木 — 育む・生み出す
 *   五行相剋 (overcome): 木→土, 土→水, 水→火, 火→金, 金→木 — 抑える
 */
import type { Branch } from "./bazi";
import { branchElement } from "./bazi";

// ============================================================
// テーブル
// ============================================================
export const SANGO: ReadonlyArray<readonly Branch[]> = [
  ["申","子","辰"], ["巳","酉","丑"], ["寅","午","戌"], ["亥","卯","未"],
];
export const RIKUGO: ReadonlyArray<readonly [Branch, Branch]> = [
  ["子","丑"], ["寅","亥"], ["卯","戌"], ["辰","酉"], ["巳","申"], ["午","未"],
];
export const CHU: ReadonlyArray<readonly [Branch, Branch]> = [
  ["子","午"], ["丑","未"], ["寅","申"], ["卯","酉"], ["辰","戌"], ["巳","亥"],
];

export type Element = "木" | "火" | "土" | "金" | "水";

// 五行相生: KEY が VALUE を生む（KEY は VALUE の親）
export const ELEMENT_GEN: Record<Element, Element> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
};
// 五行相剋: KEY が VALUE を剋する
export const ELEMENT_OVERCOME: Record<Element, Element> = {
  木: "土", 土: "水", 水: "火", 火: "金", 金: "木",
};

// ============================================================
// 基本判定
// ============================================================
export function isSango(a: Branch, b: Branch): boolean {
  if (a === b) return false;
  return SANGO.some((t) => t.includes(a) && t.includes(b));
}
export function isRikugo(a: Branch, b: Branch): boolean {
  return RIKUGO.some(([x, y]) => (x === a && y === b) || (y === a && x === b));
}
export function isChu(a: Branch, b: Branch): boolean {
  return CHU.some(([x, y]) => (x === a && y === b) || (y === a && x === b));
}

export type ElementRelation = "self" | "gen_to" | "gen_from" | "overcome_to" | "overcome_from" | "neutral";

/** a の五行から見た b の五行との関係 */
export function elementRelation(a: Element, b: Element): ElementRelation {
  if (a === b) return "self";
  if (ELEMENT_GEN[a] === b) return "gen_to";       // a が b を生む
  if (ELEMENT_GEN[b] === a) return "gen_from";     // a は b に生まれる
  if (ELEMENT_OVERCOME[a] === b) return "overcome_to";   // a が b を剋する
  if (ELEMENT_OVERCOME[b] === a) return "overcome_from"; // a は b に剋される
  return "neutral";
}

// ============================================================
// 高レベル: 二者の地支どうしの相性
// ============================================================
export type CompatKind = "best" | "good" | "neutral" | "warn";

export function branchCompatibility(myBranch: Branch, otherBranch: Branch): { kind: CompatKind; reason: string } {
  if (myBranch === otherBranch) return { kind: "good", reason: "感覚が近く、話し始めやすい関係です" };

  if (isSango(myBranch, otherBranch)) {
    return { kind: "best", reason: "自然に話しやすい関係です。互いの良さを引き出しやすい日。" };
  }
  if (isRikugo(myBranch, otherBranch)) return { kind: "best", reason: "支え合いやすい関係です。穏やかに進めて。" };
  if (isChu(myBranch, otherBranch)) return { kind: "warn", reason: "少しすれ違いやすい日です。用件は短く、距離を大切に。" };

  const myE = branchElement[myBranch] as Element;
  const otE = branchElement[otherBranch] as Element;
  const rel = elementRelation(myE, otE);
  if (rel === "gen_to" || rel === "gen_from") return { kind: "good", reason: "タイプが合いやすい関係です" };
  if (rel === "self") return { kind: "good", reason: "似たところがあり、安心しやすい関係です" };
  if (rel === "overcome_to") return { kind: "warn", reason: "強く出すぎない方が話しやすい関係です" };
  if (rel === "overcome_from") return { kind: "warn", reason: "自分のペースを守ると落ち着きやすい関係です" };
  return { kind: "neutral", reason: "穏やかな距離感です" };
}

// ============================================================
// 今日のペース用: 当日の内部コードに対する 0-100 スコア
// ============================================================
export function dailyScore(myBranch: Branch, targetBranch: Branch): number {
  if (myBranch === targetBranch) return 98;
  if (isSango(myBranch, targetBranch)) return 92;
  if (isRikugo(myBranch, targetBranch)) return 86;
  if (isChu(myBranch, targetBranch)) return 28;

  const myE = branchElement[myBranch] as Element;
  const tE = branchElement[targetBranch] as Element;
  switch (elementRelation(myE, tE)) {
    case "self": return 70;
    case "gen_to": return 78;       // 自分が育てる側
    case "gen_from": return 82;     // 育てられる側（より追い風）
    case "overcome_to": return 38;
    case "overcome_from": return 32;
    default: return 50;
  }
}
