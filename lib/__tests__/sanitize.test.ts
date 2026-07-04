import { sanitizeDailyBody, findOccultResidue } from "../sanitize";

describe("sanitizeDailyBody", () => {
  test("等級表現を壊さず中和する（大吉→大おすすめ にしない）", () => {
    const out = sanitizeDailyBody("今日は大吉です。");
    expect(out).not.toContain("大吉");
    expect(out).not.toContain("大おすすめ");
    expect(out).toContain("とても良い調子");
  });

  test("以前は素通りしていた 凶・運勢・開運 を中和する", () => {
    expect(sanitizeDailyBody("運勢は上向き。")).not.toContain("運勢");
    expect(sanitizeDailyBody("開運のヒント。")).not.toContain("開運");
    expect(sanitizeDailyBody("今日は凶です。")).toContain("控えめ");
  });

  test("占い・鑑定・五行・用神・忌神 も中和する", () => {
    const out = sanitizeDailyBody("今日の占いと鑑定。五行では用神と忌神が鍵。");
    ["占い", "鑑定", "五行", "用神", "忌神"].forEach((w) => expect(out).not.toContain(w));
  });

  test("占い用語をセルフケア語彙へ置換する", () => {
    const out = sanitizeDailyBody("運気と相性、ラッキーカラー。");
    expect(out).toContain("調子");
    expect(out).toContain("距離感");
    expect(out).not.toContain("運気");
    expect(out).not.toContain("相性");
    expect(out).not.toContain("ラッキー");
  });

  test("五行の言い回しを丸ごと除去する", () => {
    const out = sanitizeDailyBody("木の気が満ちています。散歩がおすすめ。");
    expect(out).not.toContain("木の気");
    expect(out).toContain("散歩");
  });

  test("巻き込み事故を起こさない（吉日・吉田さんは温存）", () => {
    // 単字 吉 は「吉です／吉。」限定なので、文中の吉日・吉田は変えない
    expect(sanitizeDailyBody("吉日に始めましょう。")).toContain("吉日");
    expect(sanitizeDailyBody("吉田さんに連絡。")).toContain("吉田");
  });

  test("段落間の余白は保ちつつ段落内の改行は畳む", () => {
    expect(sanitizeDailyBody("一行目\n続き\n\n次の段落")).toBe("一行目続き\n\n次の段落");
  });

  test("普通の文はそのまま返す", () => {
    const plain = "朝の予定を見直して、今日必要なことだけに絞ってみて。";
    expect(sanitizeDailyBody(plain)).toBe(plain);
  });
});

describe("findOccultResidue", () => {
  test("中和後の本文に占い語彙が残っていない", () => {
    const dirty = "今日は大吉。運勢と開運、命式の相性。ラッキーは干支と十二支。";
    expect(findOccultResidue(sanitizeDailyBody(dirty))).toEqual([]);
  });

  test("残っていれば検知する", () => {
    expect(findOccultResidue("命式が強い日")).toContain("命式");
  });
});
