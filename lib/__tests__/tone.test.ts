import { applyTone, type BaseMessage, type ToneInput } from "../tone";

const base: BaseMessage = {
  headline: "歩幅を半歩、ゆるめる日。",
  body: "火の気つよく巡る一日。",
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

  test("F型MBTIは「理屈より体感を信じて」が含まれる", () => {
    const t: ToneInput = { mbti: "INFP", bloodType: null, themes: [] };
    const r = applyTone(base, t);
    expect(r.body).toContain("理屈より体感を信じて");
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
});
