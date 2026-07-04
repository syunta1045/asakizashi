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
    kichi: "steady", score: 75,
    headline: "歩幅を半歩、ゆるめる日。",
    body: "朝のうちに、今日やることを一つだけ選んでみて。\n急いで広げるより、まず足元を整える時間を。\n返事や確認を丁寧にすると、午後の迷いが少し軽くなります。",
    doActions: ["近くの人に「ありがとう」を伝える", "昼休みに5分だけ外を歩く", "しばらく連絡していない人へ一言"],
    avoidActions: ["夕方以降の即決・大きな決断", "衝動買い（特に高額品）"],
    lucky: { item: "白い湯のみ", color: "生成り", direction: "窓辺", food: "おにぎり", sound: "静かなBGM", number: "5分" },
  },
  {
    kichi: "bright", score: 92,
    headline: "新しい一歩を選ぶ日。",
    body: "午前中に、後回しにしていた連絡を一つ進めてみて。\n大きく変えるより、最初の一歩を小さく置くことから。\n終わったことを一つ手放すと、次の予定が見えやすくなります。",
    doActions: ["午前中に大事な連絡を一つ", "新しい場所に足を運ぶ", "古いものをひとつ手放す"],
    avoidActions: ["過去の話を蒸し返すこと", "言葉を濁す返事"],
    lucky: { item: "小さなスプーン", color: "白", direction: "机の上", food: "焼き魚", sound: "風の音", number: "10分" },
  },
  {
    kichi: "soft", score: 60,
    headline: "整える時間を持つ日。",
    body: "今日は、机やバッグの中を一か所だけ整えてみて。\n大きな予定を増やすより、今あることを扱いやすくする時間を。\n夜に一行だけ残すと、自分の調子を見返しやすくなります。",
    doActions: ["机の上を整える", "深呼吸を3回", "明日の予定を一行でメモ"],
    avoidActions: ["新しい約束を増やすこと", "夜更かし"],
    lucky: { item: "観葉植物", color: "若草色", direction: "いつもの席", food: "芋類", sound: "生活音", number: "3回" },
  },
  {
    kichi: "gentle", score: 45,
    headline: "耳をすませる日。",
    body: "朝は、すぐ答えを出さずに一呼吸置いてみて。\n自分から増やすより、届いている連絡や予定を丁寧に確認する時間を。\n短い返事にも温度を添えると、やり取りが落ち着きます。",
    doActions: ["温かい飲み物を一杯", "本を15分読む", "メッセージに返事をする"],
    avoidActions: ["重要な決断", "感情的な返答"],
    lucky: { item: "温かい飲み物", color: "藍色", direction: "静かな場所", food: "豆腐", sound: "雨音", number: "15分" },
  },
  {
    kichi: "steady", score: 70,
    headline: "小さな挑戦を置く日。",
    body: "気になっていたことを、一つだけ試す時間を作ってみて。\n完成を目指すより、短いメモで十分です。\nできたところまで残しておくと、明日の自分が続けやすくなります。",
    doActions: ["一つ新しいことを始める", "窓を開けて空気を入れる", "緑のものを身につける"],
    avoidActions: ["完璧を求めすぎること", "他人と比較すること"],
    lucky: { item: "ペン", color: "深緑", direction: "窓の近く", food: "野菜", sound: "葉のこすれる音", number: "1つ" },
  },
  {
    kichi: "bright", score: 88,
    headline: "人との会話を整える日。",
    body: "最初に送る言葉を、いつもより少し丁寧にしてみて。\n長く話すより、感謝や確認を短く分けると伝わりやすくなります。\n久しぶりの相手には、近況を一言だけ置くくらいで大丈夫です。",
    doActions: ["旧友に短いメッセージを", "感謝の言葉を一つ口に出す", "近くの店でひと息つく"],
    avoidActions: ["独りで抱え込むこと", "返事を後回しにすること"],
    lucky: { item: "メモ帳", color: "桜色", direction: "明るい席", food: "和菓子", sound: "鳥の声", number: "2行" },
  },
  {
    kichi: "steady", score: 65,
    headline: "立ち止まって眺める日。",
    body: "朝の予定を見直して、今日必要なことだけに絞ってみて。\n前に進める前に、いまの状態を一度言葉にする時間を。\n夜に一行だけ残すと、明日の準備が少し楽になります。",
    doActions: ["3分だけ景色を眺める", "今日のひとことを記録する", "靴を磨く"],
    avoidActions: ["焦って次を求めること", "過去を後悔すること"],
    lucky: { item: "時計", color: "錆色", direction: "玄関まわり", food: "栗", sound: "時計の音", number: "3分" },
  },
  {
    kichi: "gentle", score: 50,
    headline: "ひと呼吸ぶん、ゆっくりの日。",
    body: "予定を詰めすぎず、朝の最初に余白を作ってみて。\n進みが遅く感じるときは、準備や片付けに時間を使うのも一つです。\n夜は明日の服や持ちものを先に決めると落ち着きます。",
    doActions: ["温かい風呂にゆっくり浸かる", "明かりを少し落とす", "明日着るものを決めておく"],
    avoidActions: ["遅くまでスクリーンを見ること", "難しい話題に深入りすること"],
    lucky: { item: "小さな灯り", color: "灰桜", direction: "寝室まわり", food: "鍋物", sound: "低めの音楽", number: "20分" },
  },
  {
    kichi: "steady", score: 78,
    headline: "声を届ける日。",
    body: "伝えたかったことを、短い言葉にして残してみて。\n話す前に一度メモすると、必要なことだけが見えやすくなります。\n誰かに送らなくても、自分のために書くだけで十分です。",
    doActions: ["手紙を一通書く", "電話を一本入れる", "感じたことを声に出す"],
    avoidActions: ["皮肉な言葉", "無意識のため息"],
    lucky: { item: "便箋", color: "藍鼠", direction: "机の端", food: "蜂蜜入りお茶", sound: "ピアノ", number: "1行" },
  },
];

function pickMock(seed: string): DailyMessage {
  // 日付ベースで同じ日には同じメッセージを返す
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return MOCKS[Math.abs(h) % MOCKS.length];
}

const INTERPRETATION_VERSION = 3;
const USE_REMOTE_INTERPRETATIONS = process.env.EXPO_PUBLIC_USE_REMOTE_INTERPRETATIONS === "1";
const cacheKey = (user: string, target: string) => `interp:v${INTERPRETATION_VERSION}:${user}:${target}`;

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
  // 生年月日未入力（userDayPillar が空）の場合は、サーバを介さず
  // 日付シードのモックを返す。MBTI / 関心テーマは tone レイヤーで反映される。
  if (!userDayPillar) {
    return pickMock(`fallback:${isoDate()}`);
  }

  if (!USE_REMOTE_INTERPRETATIONS) {
    return pickMock(`${userDayPillar}:${targetDayPillar}:${isoDate()}`);
  }

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

// バージョンを上げると旧 `interp:vN:` キーが AsyncStorage に取り残される。
// 起動時に1回だけ現行バージョン以外の interp キーを掃除する（実行済みフラグで再走を防ぐ）。
const CACHE_SWEEP_FLAG = `interp:swept:v${INTERPRETATION_VERSION}`;
export async function pruneStaleInterpretationCache(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(CACHE_SWEEP_FLAG)) return;
    const keys = await AsyncStorage.getAllKeys();
    const currentPrefix = `interp:v${INTERPRETATION_VERSION}:`;
    const stale = keys.filter((k) => k.startsWith("interp:v") && !k.startsWith(currentPrefix));
    if (stale.length > 0) await AsyncStorage.multiRemove(stale);
    await AsyncStorage.setItem(CACHE_SWEEP_FLAG, "1");
  } catch {
    // 掃除は best-effort。失敗しても本処理には影響させない
  }
}

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
    const db = await fetchInterpretation(user, target, INTERPRETATION_VERSION);
    if (!db) return null;
    const m = fromDb(db);
    const env: CacheEnvelope = { msg: m, cachedAt: Date.now() };
    await AsyncStorage.setItem(cacheKey(user, target), JSON.stringify(env));
    return m;
  } catch {
    return null;
  }
}
