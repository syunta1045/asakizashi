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
  personalSeed?: string;
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
  F: "気持ちを一度言葉にして。",
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
  "大切な人・パートナー": ["大切な人との時間を意識的に", "返事は短くても温度を添えて", "相手の予定を一つ尊重して", "先にねぎらいの言葉を渡して"],
  "恋愛・パートナーシップ": ["大切な人との時間を意識的に", "返事は短くても温度を添えて", "相手の予定を一つ尊重して", "先にねぎらいの言葉を渡して"],
  "結婚・家庭": ["家族との小さな約束を大切に", "食卓で今日の話を一つ", "家の中の気になる場所を一つ整えて", "先にねぎらいの言葉を渡して"],
  "子育て・家族": ["子どもの話に最後まで耳を傾けて", "親への近況連絡を一通", "予定を詰めず余白を一つ残して", "できたことを言葉にして伝えて"],
  "仕事・キャリア": ["午前中の判断を信じて", "小さな提案を一つ出してみて", "最初の返信をいつもより丁寧に", "後回しの確認を一つ片づけて"],
  "副業・独立": ["朝の30分を自分の事業に", "今日一つだけ前進させて", "数字を一つだけ見直して", "小さな発信を一つ残して"],
  "お金の整え方": ["衝動買いを控えめに", "領収書を整理する時間を持って", "財布の中を軽く整えて", "迷う買い物は一晩置いて"],
  "ここぞの一歩": ["大切な判断は午前のうちに", "白い物を身につけて一歩目へ", "勝つより崩れない形を選んで", "一手目だけ先に決めておいて"],
  "人間関係": ["しばらく連絡してない人に一言を", "ありがとうを口に出して", "相手の話を一つだけ聞き切って", "急ぐ返事ほどやわらかく"],
  "学び・成長": ["五分の読書を", "前から気になっていた本を開いて", "知らない言葉を一つ調べて", "学んだことを一行で残して"],
  "創作・表現": ["朝に十五分、何か書き出してみて", "完璧より、一枚の下書きを残して", "昔のメモから一つ拾って", "色や音から着想をもらって"],
  "趣味・楽しみ": ["好きなことに無心で触れる時間を", "一年ぶりの何かを再開してみて", "道具を一つ手入れして", "誰にも見せない楽しみを守って"],
  "旅・冒険": ["まだ降りたことのない駅に", "地図を眺めて次の場所を空想", "帰り道だけ少し変えて", "次に行きたい場所を一つ保存して"],
  "健康・体調": ["白湯を一杯飲んで、体をゆっくり起こして", "深呼吸を三回、肩の力を抜いて", "階段か散歩で少し巡らせて", "夜のスマホ時間を少し短く"],
  "メンタル・心": ["スマホから離れて十分の静けさを", "感情を一行だけ書き留めて", "ひとつ断って余白を守って", "答えを急がず眠る前に手放して"],
  "美容・ライフスタイル": ["生成りの服が今日のあなたに合う", "白い湯のみで一服を", "鏡まわりをさっと整えて", "香りを一つだけ軽くまとって"],
  "食・暮らし": ["旬のものを一品だけ食卓に", "出汁の香りで朝を始めて", "冷蔵庫の中を一段だけ整えて", "温かいものをゆっくり味わって"],
  "推し・ファン活動": ["推しの言葉に一行のお守りを", "応援の言葉を画面の向こうへ", "無理のない範囲で楽しみを確保して", "好きな場面を一つ見返して"],
  "静かな時間": ["朝陽を浴びて一礼を", "手を洗って気持ちを切り替えて", "部屋の空気を入れ替えて", "小さな感謝を一つ声にして"],
};

const PERSONAL_BODY_NOTES = [
  "朝のうちに一つだけ整えると、午後の迷いが少しほどけます。",
  "今日は最初の返事を丁寧にすると、人との距離感がやわらぎます。",
  "小さな違和感を見過ごさず、予定を少しだけ軽くしておくのがおすすめです。",
  "朝に決めた一つの約束を守ることで、一日全体が締まります。",
  "急いで答えを出すより、午前中は観察する時間を残してみて。",
  "身近なものを一つ磨くと、心の向きも静かに整います。",
  "今日は遠くの正解より、目の前の人への一言を大切に。",
  "朝の光を浴びてから動くと、考えすぎていたことが軽くなります。",
  "迷ったら、いつもより少し静かな選択をすると気持ちが整います。",
  "午前の余白が鍵。詰め込みすぎず、ひと呼吸置いて進めて。",
  "今日のあなたには、早めの準備が小さなお守りになります。",
  "言葉にする前に一度だけ深呼吸を。必要なことが自然に残ります。",
];

const PERSONAL_ACTIONS = [
  "朝のうちに机か財布を整える",
  "最初に会う人へ明るく挨拶する",
  "午前中に小さな用事を一つ終える",
  "白湯か温かい飲み物で始める",
  "返事を一つだけ先延ばしにしない",
  "予定を一つ減らして余白を作る",
  "今日使うものをひとつ丁寧に選ぶ",
  "窓を開けて朝の空気を入れる",
  "気になることを一行だけ書き出す",
  "昼までに短い散歩を入れる",
  "大切な人へ短く近況を送る",
  "夜に楽になる準備を朝のうちに済ませる",
];

function hashSeed(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickSeeded<T>(items: T[], seed: string, salt: string): T {
  return items[hashSeed(`${seed}:${salt}`) % items.length];
}

function seededOrder<T>(items: T[], seed: string, salt: string): T[] {
  return items
    .map((item, index) => ({
      item,
      order: hashSeed(`${seed}:${salt}:${index}:${String(item)}`),
    }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => item);
}

function uniqueStrings(items: string[]) {
  return Array.from(new Set(items));
}

function appendParagraph(body: string, paragraph: string) {
  if (body.includes(paragraph)) return body;
  return `${body}\n\n${paragraph}`;
}

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
  if (tone.personalSeed) {
    body = appendParagraph(body, pickSeeded(PERSONAL_BODY_NOTES, tone.personalSeed, "body"));
  }

  // do_actions: 関心テーマからヒントを優先採用、足りなければベース
  const themeHints: string[] = [];
  for (const t of tone.themes) {
    const arr = THEME_HINTS[t];
    if (!arr) continue;
    const ordered = tone.personalSeed ? seededOrder(arr, tone.personalSeed, `theme:${t}`) : arr;
    themeHints.push(...ordered.slice(0, 3));
  }
  const selectedThemeHints = tone.personalSeed
    ? seededOrder(uniqueStrings(themeHints), tone.personalSeed, "theme-hints")
    : uniqueStrings(themeHints);
  let doActions = [
    ...selectedThemeHints.slice(0, 2),
    ...base.doActions.filter((a) => !selectedThemeHints.includes(a)),
  ].slice(0, 3);
  if (tone.personalSeed) {
    const personalAction = pickSeeded(PERSONAL_ACTIONS, tone.personalSeed, "action");
    doActions = [
      personalAction,
      ...doActions.filter((a) => a !== personalAction),
    ].slice(0, 3);
  }

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
