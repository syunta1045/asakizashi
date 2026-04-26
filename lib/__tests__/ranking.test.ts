import { rankingForDay, branchName, rankComment } from "../ranking";

describe("rankingForDay", () => {
  test("12位すべて返却", () => {
    const r = rankingForDay("午");
    expect(r).toHaveLength(12);
  });
  test("当日の干支は1位", () => {
    const r = rankingForDay("午");
    expect(r[0].branch).toBe("午");
    expect(r[0].rank).toBe(1);
  });
  test("ランクが連番", () => {
    const r = rankingForDay("子");
    r.forEach((entry, i) => expect(entry.rank).toBe(i + 1));
  });
  test("スコアは降順", () => {
    const r = rankingForDay("申");
    for (let i = 1; i < r.length; i++) {
      expect(r[i].score).toBeLessThanOrEqual(r[i - 1].score);
    }
  });
});

describe("branchName", () => {
  test("12種類すべて定義", () => {
    expect(Object.keys(branchName)).toHaveLength(12);
  });
});

describe("rankComment", () => {
  test("各順位帯のコメント取得", () => {
    expect(rankComment(1)).toContain("主役");
    expect(rankComment(3)).toBeTruthy();
    expect(rankComment(6)).toBeTruthy();
    expect(rankComment(9)).toBeTruthy();
    expect(rankComment(12)).toContain("一歩引いて");
  });
});
