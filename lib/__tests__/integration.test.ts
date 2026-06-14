/**
 * 統合テスト: ロジックレイヤーの主要フローを検証
 */
import { threePillars, dayPillar, calcAge } from "../bazi";
import { paceForDay } from "../pace";
import { compatibility } from "../relations";
import { applyTone, type BaseMessage } from "../tone";
import { buildMonth } from "../calendar";
import { notifyTimeFrom } from "../store";
import { nextMilestone, reachedMilestone, moodStats, type JournalEntry } from "../journal";

function ymd(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

describe("統合: 命式から今日のメッセージまで", () => {
  test("1998-07-12 生まれ + 今日 → 完全なフローが破綻しない", () => {
    const birthDate = ymd(1998, 7, 12);
    const today = new Date();

    // 1. 命式算出
    const pillars = threePillars(birthDate);
    expect(pillars.year.branch).toBe("寅");
    expect(pillars.day.stem).toBe("庚");
    expect(pillars.day.branch).toBe("申");

    // 2. 当日の干支
    const todayPillar = dayPillar(today);
    expect(todayPillar.stem).toBeDefined();

    // 3. 12種類のペース
    const paceEntries = paceForDay(todayPillar.branch);
    expect(paceEntries).toHaveLength(12);
    const myPace = paceEntries.find((r) => r.branch === pillars.year.branch);
    expect(myPace).toBeDefined();
    expect(myPace!.position).toBeGreaterThanOrEqual(1);
    expect(myPace!.position).toBeLessThanOrEqual(12);

    // 4. メッセージにトーン適用
    const base: BaseMessage = {
      headline: "歩幅を半歩、ゆるめる日。",
      body: "やる気が高まりやすい一日。",
      doActions: ["散歩する", "ありがとうを言う", "本を読む"],
      avoidActions: ["即決", "衝動買い"],
    };
    const tuned = applyTone(base, { mbti: "INTJ", bloodType: "A", themes: ["仕事・キャリア"] });
    expect(tuned.headline).toBe(base.headline);
    expect(tuned.body).toContain("対話に開いてみて");
    expect(tuned.doActions).toHaveLength(3);

    // 5. 年齢算出
    const age = calcAge(1998, 7, 12, today);
    expect(age).toBeGreaterThanOrEqual(27);
  });
});

describe("統合: 通知時刻", () => {
  test("起床 6:30 → 通知 6:40", () => {
    expect(notifyTimeFrom("06:30")).toBe("06:40");
  });
  test("23:55 → 翌日 00:05", () => {
    expect(notifyTimeFrom("23:55")).toBe("00:05");
  });
});

describe("統合: 相性判定", () => {
  test("午 × 戌 → ベスト（寅午戌の三合）", () => {
    const c = compatibility("午", "戌");
    expect(c.kind).toBe("best");
  });
  test("子 × 午 → 注意（冲）", () => {
    const c = compatibility("子", "午");
    expect(c.kind).toBe("warn");
  });
  test("午 × 午 → 同気で良好", () => {
    const c = compatibility("午", "午");
    expect(c.kind).toBe("good");
  });
});

describe("統合: 月のカレンダー", () => {
  test("2026年4月 戊午ユーザー → 30日分生成", () => {
    const days = buildMonth(2026, 4, "午", new Date(2026, 3, 25));
    expect(days).toHaveLength(30);
    const today = days.find((d) => d.isToday);
    expect(today?.date).toBe(25);
    // 何かしら大切な日 or やわらかな日が混ざっている
    const hasMarked = days.some((d) => d.isKey || d.isSoft);
    expect(hasMarked).toBe(true);
  });
});

describe("統合: マイルストーン", () => {
  test("0日 → 次は3日目", () => {
    expect(nextMilestone(0)?.days).toBe(3);
  });
  test("3日達成 → reached + 次は7日", () => {
    expect(reachedMilestone(3)).not.toBeNull();
    expect(nextMilestone(3)?.days).toBe(7);
  });
  test("365日達成 → 次の節目はなし", () => {
    expect(nextMilestone(365)).toBeNull();
  });
});

describe("統合: 気分統計", () => {
  test("空の場合は total=0", () => {
    const stats = moodStats({}, 30);
    expect(stats.total).toBe(0);
    expect(stats.counts).toEqual([0, 0, 0, 0]);
  });
  test("3件の入力 → total=3", () => {
    const today = new Date();
    const k = (offset: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      return d.toISOString().slice(0, 10);
    };
    const entries: Record<string, JournalEntry> = {
      [k(0)]: { date: k(0), mood: 0, note: "" },
      [k(1)]: { date: k(1), mood: 0, note: "" },
      [k(2)]: { date: k(2), mood: 2, note: "" },
    };
    const stats = moodStats(entries, 30);
    expect(stats.total).toBe(3);
    expect(stats.counts[0]).toBe(2);
    expect(stats.counts[2]).toBe(1);
  });
});
