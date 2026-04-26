import {
  isSango,
  isRikugo,
  isChu,
  elementRelation,
  branchCompatibility,
  dailyScore,
  SANGO,
  RIKUGO,
  CHU,
} from "../compatibility";
import type { Branch } from "../bazi";

describe("compatibility tables", () => {
  test("SANGO は 4 組で各 3 支", () => {
    expect(SANGO).toHaveLength(4);
    SANGO.forEach((t) => expect(t).toHaveLength(3));
  });
  test("RIKUGO / CHU は 6 組ペア", () => {
    expect(RIKUGO).toHaveLength(6);
    expect(CHU).toHaveLength(6);
  });
});

describe("isSango", () => {
  test("申子辰は三合", () => {
    expect(isSango("申", "子")).toBe(true);
    expect(isSango("子", "辰")).toBe(true);
    expect(isSango("辰", "申")).toBe(true);
  });
  test("同じ干支は三合ではない", () => {
    expect(isSango("子", "子")).toBe(false);
  });
  test("無関係は false", () => {
    expect(isSango("子", "丑")).toBe(false);
  });
});

describe("isRikugo / isChu", () => {
  test("子丑は六合 / 子午は冲", () => {
    expect(isRikugo("子", "丑")).toBe(true);
    expect(isRikugo("丑", "子")).toBe(true);
    expect(isChu("子", "午")).toBe(true);
    expect(isChu("午", "子")).toBe(true);
  });
  test("無関係は false", () => {
    expect(isRikugo("子", "辰")).toBe(false);
    expect(isChu("子", "辰")).toBe(false);
  });
});

describe("elementRelation", () => {
  test("木→火は gen_to（生む側）", () => {
    expect(elementRelation("木", "火")).toBe("gen_to");
  });
  test("火→木は gen_from（生まれる側）", () => {
    expect(elementRelation("火", "木")).toBe("gen_from");
  });
  test("木→土は overcome_to（剋する）", () => {
    expect(elementRelation("木", "土")).toBe("overcome_to");
  });
  test("土→木は overcome_from（剋される）", () => {
    expect(elementRelation("土", "木")).toBe("overcome_from");
  });
  test("同じ五行は self", () => {
    expect(elementRelation("水", "水")).toBe("self");
  });
});

describe("branchCompatibility", () => {
  test("同じ干支は good", () => {
    const r = branchCompatibility("子", "子");
    expect(r.kind).toBe("good");
  });
  test("三合は best", () => {
    expect(branchCompatibility("申", "子").kind).toBe("best");
  });
  test("六合は best", () => {
    expect(branchCompatibility("子", "丑").kind).toBe("best");
  });
  test("冲は warn", () => {
    expect(branchCompatibility("子", "午").kind).toBe("warn");
  });
  test("理由文が空でない", () => {
    expect(branchCompatibility("子", "丑").reason.length).toBeGreaterThan(0);
  });
});

describe("dailyScore", () => {
  test("自分と同じ干支は 98", () => {
    expect(dailyScore("子", "子")).toBe(98);
  });
  test("三合は 92", () => {
    expect(dailyScore("申", "子")).toBe(92);
  });
  test("六合は 86", () => {
    expect(dailyScore("子", "丑")).toBe(86);
  });
  test("冲は 28（最低圏）", () => {
    expect(dailyScore("子", "午")).toBe(28);
  });
  test("全12支とも 0-100 の範囲", () => {
    const branches: Branch[] = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    for (const t of branches) {
      for (const m of branches) {
        const s = dailyScore(m, t);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
  });
  test("ランキングが 12 位ぴったり生成される（同点許容）", () => {
    const branches: Branch[] = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
    const scores = branches.map((b) => dailyScore(b, "子"));
    expect(scores).toHaveLength(12);
    // 自分と同じ「子」が最高スコア
    expect(Math.max(...scores)).toBe(98);
  });
});
