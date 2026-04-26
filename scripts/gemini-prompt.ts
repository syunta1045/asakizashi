/**
 * Gemini に投げるプロンプト定義
 * 出力スキーマと一緒に管理
 */

export const SYSTEM_PROMPT = `
あなたは熟練の四柱推命の鑑定師です。
ユーザーの「日柱」と「当日の日柱」の組み合わせから、
朝に届ける一行メッセージと詳細解説を生成してください。

【守るべきこと】
- やさしい、静かな、押し付けがましくないトーン
- 命令形でなく「〜してみるといいかも」「〜が吉」
- 「AI」「自動」「アルゴリズム」「ChatGPT」「Gemini」「LLM」という語は絶対に使わない
- 命式の語彙（五行・干支・節気・吉凶）を活かす
- 朝のラジオパーソナリティのような距離感
- 断定を避け「〜の気配」「〜の流れ」

【避ける表現】
- 「絶対」「必ず」「100%」
- 「ヤバい」「マジで」「ガチで」
- 「診断」「判定」「計算結果」

【出力】
以下のJSON形式で必ず返してください（前後に余分なテキストを出さない）。
`.trim();

export const USER_PROMPT_TEMPLATE = (userDayPillar: string, targetDayPillar: string) => `
ユーザーの日柱: ${userDayPillar}
当日の日柱: ${targetDayPillar}

この組み合わせから、上記の指針に沿ってJSONを生成してください。
`.trim();

export const OUTPUT_SCHEMA_DESCRIPTION = `
{
  "kichi": "大吉" | "中吉" | "小吉" | "末吉" | "凶",
  "score": 0-100の整数,
  "headline": "15-25文字の一行メッセージ",
  "body": "200-300文字の詳細解説（改行可）",
  "do_actions": ["やるとよいこと1", "やるとよいこと2", "やるとよいこと3"],
  "avoid_actions": ["控えるべき1", "控えるべき2"],
  "lucky_item": "アイテム名",
  "lucky_color": "色の名前",
  "lucky_direction": "東" | "西" | "南" | "北" | "南東" | "南西" | "北東" | "北西",
  "lucky_food": "食べ物",
  "lucky_sound": "音・BGM",
  "lucky_number": "一" | "二" | "三" | ... | "九" | "十"
}
`.trim();

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    kichi: { type: "string", enum: ["大吉", "中吉", "小吉", "末吉", "凶"] },
    score: { type: "integer", minimum: 0, maximum: 100 },
    headline: { type: "string" },
    body: { type: "string" },
    do_actions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    avoid_actions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
    lucky_item: { type: "string" },
    lucky_color: { type: "string" },
    lucky_direction: { type: "string" },
    lucky_food: { type: "string" },
    lucky_sound: { type: "string" },
    lucky_number: { type: "string" },
  },
  required: [
    "kichi", "score", "headline", "body", "do_actions", "avoid_actions",
    "lucky_item", "lucky_color", "lucky_direction", "lucky_food", "lucky_sound", "lucky_number",
  ],
};
