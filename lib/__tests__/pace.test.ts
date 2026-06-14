import { paceForDay, branchName, paceComment } from "../pace";

describe("paceForDay", () => {
  test("12種類すべて返却", () => {
    const r = paceForDay("午");
    expect(r).toHaveLength(12);
  });
  test("当日の入力に合うものが先頭", () => {
    const r = paceForDay("午");
    expect(r[0].branch).toBe("午");
    expect(r[0].position).toBe(1);
  });
  test("位置が連番", () => {
    const r = paceForDay("子");
    r.forEach((entry, i) => expect(entry.position).toBe(i + 1));
  });
  test("スコアは降順", () => {
    const r = paceForDay("申");
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

describe("paceComment", () => {
  test("各順位帯のコメント取得", () => {
    expect(paceComment(1)).toContain("主役");
    expect(paceComment(3)).toBeTruthy();
    expect(paceComment(6)).toBeTruthy();
    expect(paceComment(9)).toBeTruthy();
    expect(paceComment(12)).toContain("一歩引いて");
  });
});
