/**
 * 十二支ランキング算出
 * 当日の干支に対し、三合・六合・冲・五行相生/相剋を加味したスコアでランク付け。
 * ロジックは lib/compatibility.ts の dailyScore に統一。
 */
import { BRANCHES, type Branch } from "./bazi";
import { dailyScore } from "./compatibility";

export type RankingEntry = {
  branch: Branch;
  rank: number;
  score: number;
};

/**
 * 当日の干支ブランチに対し、十二支それぞれのスコアを算出
 */
export function rankingForDay(targetBranch: Branch): RankingEntry[] {
  const scored = BRANCHES.map((b) => ({ branch: b, score: dailyScore(b, targetBranch) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s, i) => ({ ...s, rank: i + 1 }));
}

export const branchName: Record<Branch, string> = {
  子: "ねずみ", 丑: "うし", 寅: "とら", 卯: "うさぎ", 辰: "たつ", 巳: "へび",
  午: "うま", 未: "ひつじ", 申: "さる", 酉: "とり", 戌: "いぬ", 亥: "いのしし",
};

/**
 * 順位帯ごとの一行コメント
 */
export function rankComment(rank: number): string {
  if (rank === 1) return "今日の主役。動けば動くほど運気がついてくる。";
  if (rank <= 3) return "勢いのある一日。前向きな選択を。";
  if (rank <= 6) return "穏やかに、自分のペースで進めて。";
  if (rank <= 9) return "無理せず、整える時間を意識的に。";
  if (rank === 12) return "一歩引いて、明日の準備を整える日。";
  return "急がず、人の声に耳を傾けて。";
}
