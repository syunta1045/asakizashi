import { buildMonth, nextKeyDays } from "../calendar";

describe("buildMonth", () => {
  test("2026年4月 → 30日分", () => {
    const days = buildMonth(2026, 4, "午", new Date(2026, 3, 1));
    expect(days).toHaveLength(30);
  });
  test("2024年2月（うるう年）→ 29日分", () => {
    const days = buildMonth(2024, 2, "午", new Date(2024, 1, 1));
    expect(days).toHaveLength(29);
  });
  test("2025年2月（平年）→ 28日分", () => {
    const days = buildMonth(2025, 2, "午", new Date(2025, 1, 1));
    expect(days).toHaveLength(28);
  });
  test("各日に pillar が含まれる", () => {
    const days = buildMonth(2026, 4, "午", new Date(2026, 3, 25));
    days.forEach((d) => {
      expect(d.pillar.stem).toBeDefined();
      expect(d.pillar.branch).toBeDefined();
    });
  });
  test("isToday は1日のみ true", () => {
    const days = buildMonth(2026, 4, "午", new Date(2026, 3, 25));
    const todays = days.filter((d) => d.isToday);
    expect(todays).toHaveLength(1);
    expect(todays[0].date).toBe(25);
  });
});

describe("nextKeyDays", () => {
  test("当日以降の節目を3件まで取得", () => {
    const days = buildMonth(2026, 4, "午", new Date(2026, 3, 1));
    const keys = nextKeyDays(days, 1, 3);
    expect(keys.length).toBeLessThanOrEqual(3);
    keys.forEach((d) => expect(d.date).toBeGreaterThanOrEqual(1));
  });
});
