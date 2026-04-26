/**
 * トーン調整ロジック
 *
 * ベースの解釈文に対し、MBTI × 血液型 × 関心テーマを反映して
 * パーソナライズされた一行・本文・行動指針を組み立てる。
 *
 * MVP: ルールベースで差し込み。LLM呼び出しなし。
 */

export type ToneInput = {
  mbti: string | null;
  bloodType: "A" | "B" | "O" | "AB" | "unknown" | null;
  themes: string[];
};

export type BaseMessage = {
  headline: string;
  body: string;
  doActions: string[];
  avoidActions: string[];
};

// MBTIの主要4軸を抽出
function mbtiAxis(mbti: string | null) {
  if (!mbti || mbti.length !== 4) return null;
  return {
    EI: mbti[0],   // 外向 / 内向
    SN: mbti[1],   // 感覚 / 直観
    TF: mbti[2],   // 思考 / 感情
    JP: mbti[3],   // 判断 / 知覚
  };
}

// MBTI軸ごとの開き方フレーズ（将来 body 先頭に挿入予定。現状は CLOSERS のみ使用）
// const MBTI_OPENERS: Record<string, string[]> = { ... };

const MBTI_CLOSERS: Record<string, string> = {
  E: "誰かに話すと整います。",
  I: "一人の時間を大切に。",
  T: "対話に開いてみて。",
  F: "理屈より体感を信じて。",
  J: "余白を残して進めて。",
  P: "一つ決めて、動いてみて。",
};

const BLOOD_TWEAK: Record<string, (a: string) => string> = {
  A: (a) => a.replace(/動く/g, "計画して動く").replace(/決断/g, "確認してから決断"),
  B: (a) => a.replace(/計画的に/g, "感じたままに").replace(/慎重/g, "好奇心で"),
  O: (a) => a, // そのまま（リーダー的・決断力タイプ）
  AB: (a) => `${a}（無理せず）`,
  unknown: (a) => a,
};

const THEME_HINTS: Record<string, string[]> = {
  "恋愛・パートナーシップ": ["大切な人との時間を意識的に", "夕方の出会いに気を配って"],
  "仕事・キャリア": ["午前中の判断を信じて", "小さな提案を一つ出してみて"],
  "お金・金運": ["衝動買いを控えめに", "領収書を整理する時間を持って"],
  "健康・体調": ["白湯を一杯、火の気を整えて", "深呼吸を三回、肩の力を抜いて"],
  "人間関係": ["しばらく連絡してない人に一言を", "ありがとうを口に出して"],
  "学び・成長": ["五分の読書を", "前から気になっていた本を開いて"],
  "美容・ライフスタイル": ["生成りの服が今日のあなたに合う", "白い湯のみで一服を"],
  "結婚・家庭": ["家族との小さな約束を大切に", "食卓で今日の話を一つ"],
};

export function applyTone(base: BaseMessage, tone: ToneInput): BaseMessage {
  const axis = mbtiAxis(tone.mbti);

  // headline: そのまま
  let headline = base.headline;

  // body にトーン closer を1〜2つ加える
  const closers: string[] = [];
  if (axis) {
    closers.push(MBTI_CLOSERS[axis.EI]);
    if (axis.TF === "T") closers.push(MBTI_CLOSERS.T);
    else closers.push(MBTI_CLOSERS.F);
  }
  let body = base.body;
  if (closers.length > 0) {
    body = `${body}\n\n${closers.join(" ")}`;
  }

  // do_actions: 関心テーマからヒントを優先採用、足りなければベース
  const themeHints: string[] = [];
  for (const t of tone.themes) {
    const arr = THEME_HINTS[t];
    if (arr) themeHints.push(...arr);
  }
  let doActions = [
    ...themeHints.slice(0, 2),
    ...base.doActions.filter((a) => !themeHints.includes(a)),
  ].slice(0, 3);

  // 血液型による文末調整
  if (tone.bloodType) {
    const tweak = BLOOD_TWEAK[tone.bloodType];
    if (tweak) doActions = doActions.map(tweak);
  }

  return {
    headline,
    body,
    doActions,
    avoidActions: base.avoidActions,
  };
}
