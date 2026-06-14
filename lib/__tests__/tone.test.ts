import { applyTone, type BaseMessage, type ToneInput } from "../tone";

const base: BaseMessage = {
  headline: "歩幅を半歩、ゆるめる日。",
  body: "やる気が高まりやすい一日。",
  doActions: ["近くの人に「ありがとう」を伝える", "昼休みに五分外を歩く", "しばらく連絡してない人へ一言"],
  avoidActions: ["夕方以降の即決", "衝動買い"],
};

describe("applyTone", () => {
  test("MBTI null + 全部 null でも壊れない", () => {
    const r = applyTone(base, { mbti: null, bloodType: null, themes: [] });
    expect(r.headline).toBe(base.headline);
    expect(r.body).toBe(base.body);
    expect(r.doActions).toHaveLength(3);
  });

  test("INTJ + A型で語尾調整される", () => {
    const t: ToneInput = { mbti: "INTJ", bloodType: "A", themes: [] };
    const r = applyTone(base, t);
    expect(r.body).toContain("一人の時間を大切に。");
    expect(r.body).toContain("対話に開いてみて。");
  });

  test("関心テーマで do_actions 上位置換", () => {
    const t: ToneInput = { mbti: null, bloodType: null, themes: ["健康・体調"] };
    const r = applyTone(base, t);
    expect(r.doActions[0]).toMatch(/白湯|深呼吸/);
  });

  test("AB型は文末に（無理せず）が付く", () => {
    const t: ToneInput = { mbti: null, bloodType: "AB", themes: [] };
    const r = applyTone(base, t);
    r.doActions.forEach((a) => expect(a).toContain("（無理せず）"));
  });

  test("E型MBTIは「誰かに話すと整います」が含まれる", () => {
    const t: ToneInput = { mbti: "ENFP", bloodType: null, themes: [] };
    const r = applyTone(base, t);
    expect(r.body).toContain("誰かに話すと整います");
  });

  test("F型MBTIは気持ちの言語化ヒントが含まれる", () => {
    const t: ToneInput = { mbti: "INFP", bloodType: null, themes: [] };
    const r = applyTone(base, t);
    expect(r.body).toContain("気持ちを一度言葉にして");
  });

  test("複数テーマで関連アクションが優先される", () => {
    const t: ToneInput = { mbti: null, bloodType: null, themes: ["健康・体調", "学び・成長"] };
    const r = applyTone(base, t);
    expect(r.doActions[0]).toMatch(/白湯|深呼吸|読書/);
  });

  test("avoidActions は変わらない", () => {
    const t: ToneInput = { mbti: "INTJ", bloodType: "A", themes: ["仕事・キャリア"] };
    const r = applyTone(base, t);
    expect(r.avoidActions).toEqual(base.avoidActions);
  });

  test("不正MBTI 'XXXX' でもクラッシュしない", () => {
    const t: ToneInput = { mbti: "XXXX", bloodType: null, themes: [] };
    const r = applyTone(base, t);
    expect(r.doActions).toHaveLength(3);
  });

  test("personalSeed で個人向けの本文と行動が足される", () => {
    const a = applyTone(base, { mbti: null, bloodType: null, themes: [], personalSeed: "甲子|乙丑|丙寅|丁卯" });
    const b = applyTone(base, { mbti: null, bloodType: null, themes: [], personalSeed: "甲子|乙丑|丙寅|丁卯" });
    expect(a.body).toBe(b.body);
    expect(a.body).not.toBe(base.body);
    expect(a.doActions).toHaveLength(3);
    expect(a.doActions[0]).not.toBe(base.doActions[0]);
  });

  test("personalSeed で同じテーマでもおすすめの並びが変わる", () => {
    const a = applyTone(base, {
      mbti: null,
      bloodType: null,
      themes: ["健康・体調"],
      personalSeed: "甲子|乙丑|丙寅|丁卯",
    });
    const b = applyTone(base, {
      mbti: null,
      bloodType: null,
      themes: ["健康・体調"],
      personalSeed: "甲子|乙丑|丙寅|戊辰",
    });

    expect(a.doActions).not.toEqual(b.doActions);
    expect(new Set([...a.doActions, ...b.doActions]).size).toBeGreaterThan(3);
  });
});
