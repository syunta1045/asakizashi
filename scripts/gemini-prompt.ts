/**
 * Gemini に投げるプロンプト定義
 * 出力スキーマと一緒に管理
 */

export const SYSTEM_PROMPT = `
あなたは朝のセルフケア習慣を支える編集者です。
ユーザーの内部プロフィールコードと当日の内部コードを参考にしながら、
朝に届ける朝メモと具体的な行動メモを生成してください。

【守るべきこと】
- やさしい、静かな、押し付けがましくないトーン
- 命令形でなく「〜してみるといいかも」「〜がおすすめ」
- 「AI」「自動」「アルゴリズム」「ChatGPT」「Gemini」「LLM」という語は絶対に使わない
- 占い、星占い、十二支、干支、四柱推命、命式、吉凶、運勢、開運、ラッキーという語は本文・見出しに使わない
- 生年月日や内部コードを説明しない
- 朝のラジオパーソナリティのような距離感
- 断定を避け「〜しやすい」「〜を整える」「〜を一つ選ぶ」

【避ける表現】
- 「絶対」「必ず」「100%」
- 「ヤバい」「マジで」「ガチで」
- 「診断」「判定」「計算結果」
- 未来を断定する表現
- 不安をあおる表現

【出力】
以下のJSON形式で必ず返してください（前後に余分なテキストを出さない）。
`.trim();

export const USER_PROMPT_TEMPLATE = (userDayPillar: string, targetDayPillar: string) => `
ユーザーの内部プロフィールコード: ${userDayPillar}
当日の内部コード: ${targetDayPillar}

この組み合わせから、上記の指針に沿ってJSONを生成してください。
`.trim();

export const OUTPUT_SCHEMA_DESCRIPTION = `
{
  "kichi": "bright" | "steady" | "soft" | "gentle" | "hold"（内部ラベル。本文には出さない）,
  "score": 0-100の整数（内部ペース値。本文には点数として出さない）,
  "headline": "15-25文字の朝メモ見出し",
  "body": "160-260文字の朝のセルフケア本文（改行可）",
  "do_actions": ["やるとよいこと1", "やるとよいこと2", "やるとよいこと3"],
  "avoid_actions": ["控えるべき1", "控えるべき2"],
  "lucky_item": "整えるための持ちもの",
  "lucky_color": "色の名前",
  "lucky_direction": "窓辺" | "机の上" | "玄関まわり" | "静かな席" | "寝室まわり" | "いつもの席" などの場所,
  "lucky_food": "整えやすい食べ物",
  "lucky_sound": "落ち着きやすい音・BGM",
  "lucky_number": "1行" | "3回" | "5分" | "10分" | "20分" などの小さな目安
}
`.trim();

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    kichi: { type: "string", enum: ["bright", "steady", "soft", "gentle", "hold"] },
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
