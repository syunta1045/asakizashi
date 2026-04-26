/**
 * 日本の伝統暦表示ユーティリティ
 */

const REIWA_START_YEAR = 2019;
const MONTH_TRADITIONAL = [
  "睦月", "如月", "弥生", "卯月", "皐月", "水無月",
  "文月", "葉月", "長月", "神無月", "霜月", "師走",
] as const;
const KANJI_NUM = ["〇","一","二","三","四","五","六","七","八","九"] as const;
const WEEKDAYS = ["日","月","火","水","木","金","土"] as const;

function toKanjiNum(n: number): string {
  if (n === 0) return "〇";
  if (n === 10) return "十";
  if (n < 10) return KANJI_NUM[n];
  if (n < 20) return "十" + (n === 10 ? "" : KANJI_NUM[n - 10]);
  if (n < 30) return "二十" + (n === 20 ? "" : KANJI_NUM[n - 20]);
  if (n < 40) return "三十" + (n === 30 ? "" : KANJI_NUM[n - 30]);
  return String(n);
}

export function reiwaLabel(d: Date = new Date()): string {
  const y = d.getFullYear();
  const reiwa = y - REIWA_START_YEAR + 1;
  const month = MONTH_TRADITIONAL[d.getMonth()];
  const day = toKanjiNum(d.getDate());
  return `令和${toKanjiNum(reiwa)}年 ${month}${day}日`;
}

export function modernLabel(d: Date = new Date()): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const wd = WEEKDAYS[d.getDay()];
  return `${m}月${day}日（${wd}）`;
}

/**
 * ローカルタイムゾーンでの YYYY-MM-DD を返す。
 * `toISOString()` は UTC ベースで、JST 深夜0〜9時は前日扱いになるため使わない。
 */
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
