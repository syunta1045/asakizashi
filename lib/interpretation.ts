/**
 * 当日のメッセージを取得するレイヤー
 *
 * 優先順位:
 * 1. Supabase の interpretations テーブルから取得（オンライン・サインイン済み）
 * 2. ローカルキャッシュ（過去取得分）
 * 3. ハードコードされたモック（最終フォールバック）
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchInterpretation, type DbInterpretation } from "./supabase";
import { isoDate } from "./dateUtils";

export type DailyMessage = {
  kichi: string;
  score: number;
  headline: string;
  body: string;
  doActions: string[];
  avoidActions: string[];
  lucky: {
    item: string;
    color: string;
    direction: string;
    food: string;
    sound: string;
    number: string;
  };
};

const MOCKS: DailyMessage[] = [
  {
    kichi: "中吉", score: 75,
    headline: "歩幅を半歩、ゆるめる日。",
    body: "火の気つよく巡る一日。\n前へ進む力はじゅうぶん。\nだからこそ急がず、まわりの声に耳をすませて。",
    doActions: ["近くの人に「ありがとう」を伝える", "昼休みに五分だけ外を歩く", "しばらく連絡してない人へ一言"],
    avoidActions: ["夕方以降の即決・大きな決断", "衝動買い（特に高額品）"],
    lucky: { item: "白い湯のみ", color: "生成り", direction: "南東", food: "握り飯", sound: "鈴の音", number: "七" },
  },
  {
    kichi: "大吉", score: 92,
    headline: "新しい流れに身を委ねる日。",
    body: "金の気が清らかに巡ります。\n決断のタイミングが整う一日。\n午前中の判断を信じて、潔く動いてみて。",
    doActions: ["午前中に大事な連絡を一つ", "新しい場所に足を運ぶ", "古いものをひとつ手放す"],
    avoidActions: ["過去の話を蒸し返すこと", "言葉を濁す返事"],
    lucky: { item: "銀のスプーン", color: "白", direction: "西", food: "焼き魚", sound: "風鈴", number: "九" },
  },
  {
    kichi: "小吉", score: 60,
    headline: "整える時間を持つ日。",
    body: "土の気が穏やかに広がります。\n大きな動きより、足元を整えることが吉。\n一日の終わりに机を片付けてみて。",
    doActions: ["机の上を整える", "深呼吸を三回", "明日の予定を一行でメモ"],
    avoidActions: ["新しい約束を増やすこと", "夜更かし"],
    lucky: { item: "観葉植物", color: "若草色", direction: "中央", food: "芋類", sound: "土鍋の音", number: "五" },
  },
  {
    kichi: "末吉", score: 45,
    headline: "耳をすませる日。",
    body: "水の気が静かに巡ります。\n自分から動くより、来るものを受け取る日。\n友人からのメッセージに丁寧に返事を。",
    doActions: ["温かい飲み物を一杯", "本を15分読む", "メッセージに返事をする"],
    avoidActions: ["重要な決断", "感情的な返答"],
    lucky: { item: "湯たんぽ", color: "藍色", direction: "北", food: "豆腐", sound: "雨音", number: "六" },
  },
  {
    kichi: "中吉", score: 70,
    headline: "小さな挑戦が芽を出す日。",
    body: "木の気が勢いよく伸びる一日。\n気になっていたことを一つだけ始めてみて。\n完璧を目指さず、まず試すことが吉。",
    doActions: ["一つ新しいことを始める", "東向きの窓を開ける", "緑のものを身につける"],
    avoidActions: ["完璧を求めすぎること", "他人と比較すること"],
    lucky: { item: "万年筆", color: "深緑", direction: "東", food: "山菜", sound: "木の葉", number: "三" },
  },
  {
    kichi: "大吉", score: 88,
    headline: "縁が動き出す日。",
    body: "人と人を結ぶ気が活発に巡ります。\n今日交わす言葉が、しばらく後に意味を持つことも。\n丁寧な一言を心がけて。",
    doActions: ["旧友に短いメッセージを", "感謝の言葉を一つ口に出す", "カフェで偶然の出会いに開く"],
    avoidActions: ["独りで抱え込むこと", "返事を後回しにすること"],
    lucky: { item: "名刺入れ", color: "桜色", direction: "南", food: "和菓子", sound: "鳥のさえずり", number: "二" },
  },
  {
    kichi: "中吉", score: 65,
    headline: "立ち止まって眺める日。",
    body: "前進よりも、いま立っている場所を確かめるとき。\n振り返ると見えるものが、これからの道しるべになります。\n日記を一行書くだけでも違う。",
    doActions: ["三分だけ景色を眺める", "今日のひとことを記録する", "靴を磨く"],
    avoidActions: ["焦って次を求めること", "過去を後悔すること"],
    lucky: { item: "懐中時計", color: "錆色", direction: "西南", food: "栗", sound: "時計の針", number: "八" },
  },
  {
    kichi: "末吉", score: 50,
    headline: "ひと呼吸ぶん、ゆっくりの日。",
    body: "気の流れがゆるやかな日。\n物事の進みが遅く感じても、それは整える時間。\n夜は早めに休んで、明日に備えて。",
    doActions: ["温かい風呂にゆっくり浸かる", "明かりを少し落とす", "明日着るものを決めておく"],
    avoidActions: ["遅くまでスクリーンを見ること", "難しい話題に深入りすること"],
    lucky: { item: "アロマキャンドル", color: "灰桜", direction: "北西", food: "鍋物", sound: "焚き火", number: "四" },
  },
  {
    kichi: "中吉", score: 78,
    headline: "声を届ける日。",
    body: "言葉の力が冴える一日。\n伝えたかったことを、丁寧に言葉にしてみて。\n書いたり話したりすることで、自分自身も整います。",
    doActions: ["手紙を一通書く", "電話を一本入れる", "感じたことを声に出す"],
    avoidActions: ["皮肉な言葉", "無意識のため息"],
    lucky: { item: "便箋", color: "藍鼠", direction: "東南", food: "蜂蜜入りお茶", sound: "ピアノ", number: "一" },
  },
];

function pickMock(seed: string): DailyMessage {
  // 日付ベースで同じ日には同じメッセージを返す
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return MOCKS[Math.abs(h) % MOCKS.length];
}

const cacheKey = (user: string, target: string) => `interp:${user}:${target}`;

function fromDb(d: DbInterpretation): DailyMessage {
  return {
    kichi: d.kichi,
    score: d.score,
    headline: d.headline,
    body: d.body,
    doActions: d.do_actions,
    avoidActions: d.avoid_actions,
    lucky: {
      item: d.lucky_item,
      color: d.lucky_color,
      direction: d.lucky_direction,
      food: d.lucky_food,
      sound: d.lucky_sound,
      number: d.lucky_number,
    },
  };
}

export async function getDailyMessage(userDayPillar: string, targetDayPillar: string): Promise<DailyMessage> {
  // 1. キャッシュから即返却
  const cached = await readCache(userDayPillar, targetDayPillar);
  if (cached) {
    // 並列でリフレッシュ（fire & forget）
    refreshFromServer(userDayPillar, targetDayPillar).catch(() => {});
    return cached;
  }

  // 2. サーバから取得
  const fresh = await refreshFromServer(userDayPillar, targetDayPillar);
  if (fresh) return fresh;

  // 3. モックフォールバック（日付ベースで安定、ローカルTZ）
  return pickMock(`${userDayPillar}:${targetDayPillar}:${isoDate()}`);
}

type CacheEnvelope = { msg: DailyMessage; cachedAt: number };

// キャッシュ有効期間: 24時間。これを超えたら陳腐とみなし再取得
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function readCache(user: string, target: string): Promise<DailyMessage | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(user, target));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope | DailyMessage;
    // 旧形式（envelope なし）はそのまま無効化して返却しない
    if (!("cachedAt" in parsed) || !("msg" in parsed)) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.msg;
  } catch {
    return null;
  }
}

async function refreshFromServer(user: string, target: string): Promise<DailyMessage | null> {
  try {
    const db = await fetchInterpretation(user, target, 1);
    if (!db) return null;
    const m = fromDb(db);
    const env: CacheEnvelope = { msg: m, cachedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey(user, target), JSON.stringify(env));
    return m;
  } catch {
    return null;
  }
}
