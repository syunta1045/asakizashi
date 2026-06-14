/**
 * 生まれ年の内部コードを使った「今日のペース」算出
 * 当日の内部コードに対し、関係性を加味したスコアで並べる。
 * ロジックは lib/compatibility.ts の dailyScore に統一。
 */
import { BRANCHES, type Branch } from "./bazi";
import { dailyScore } from "./compatibility";

export type PaceEntry = {
  branch: Branch;
  position: number;
  score: number;
};

/**
 * 当日の内部コードに対し、それぞれのスコアを算出
 */
export function paceForDay(targetBranch: Branch): PaceEntry[] {
  const scored = BRANCHES.map((b) => ({ branch: b, score: dailyScore(b, targetBranch) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, position: i + 1 }));
}

export const branchName: Record<Branch, string> = {
  子: "ねずみ", 丑: "うし", 寅: "とら", 卯: "うさぎ", 辰: "たつ", 巳: "へび",
  午: "うま", 未: "ひつじ", 申: "さる", 酉: "とり", 戌: "いぬ", 亥: "いのしし",
};

/**
 * ペース帯ごとの一行コメント
 */
export function paceComment(position: number): string {
  if (position === 1) return "今日の主役。動くほどペースを作りやすい日。";
  if (position <= 3) return "勢いのある一日。前向きな選択を。";
  if (position <= 6) return "穏やかに、自分のペースで進めて。";
  if (position <= 9) return "無理せず、整える時間を意識的に。";
  if (position === 12) return "一歩引いて、明日の準備を整える日。";
  return "急がず、人の声に耳を傾けて。";
}
