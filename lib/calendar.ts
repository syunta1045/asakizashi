/**
 * 月の流れ算出
 * 当月の各日の干支を計算し、ユーザーの日柱との相性で「節目の日」「やわらかな日」を判定
 */
import { dayPillar, branchElement, type Pillar, type Branch } from "./bazi";
import { isSango, isRikugo, isChu, elementRelation, type Element } from "./compatibility";

export type CalendarDay = {
  date: number;        // 1..31
  pillar: Pillar;
  isToday: boolean;
  isKey: boolean;      // 大切な日（三合・六合）
  isSoft: boolean;     // やわらかな日（同気・相生）
  isCaution: boolean;  // 注意の日（冲・剋）
};

export function buildMonth(year: number, month: number, userBranch: Branch, today: Date): CalendarDay[] {
  const days = new Date(year, month, 0).getDate();
  const result: CalendarDay[] = [];
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();
  const myE = branchElement[userBranch] as Element;

  for (let d = 1; d <= days; d++) {
    const date = new Date(Date.UTC(year, month - 1, d));
    const p = dayPillar(date);
    const dayE = branchElement[p.branch] as Element;
    const rel = elementRelation(myE, dayE);

    const isKey = isSango(userBranch, p.branch) || isRikugo(userBranch, p.branch);
    const isSoft = !isKey && (rel === "self" || rel === "gen_to" || rel === "gen_from");
    const isCaution = isChu(userBranch, p.branch);

    result.push({
      date: d,
      pillar: p,
      isToday: year === todayY && month === todayM && d === todayD,
      isKey,
      isSoft,
      isCaution,
    });
  }
  return result;
}

export function nextKeyDays(month: CalendarDay[], todayDate: number, n: number = 3): CalendarDay[] {
  return month
    .filter((d) => d.date >= todayDate && (d.isKey || d.isSoft))
    .slice(0, n);
}
