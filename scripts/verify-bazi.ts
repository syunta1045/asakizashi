/**
 * 命式エンジンの実装と既知の正解（万年暦）を100件で照合するためのスクリプト。
 *
 * 使い方:
 *   npx tsx scripts/verify-bazi.ts > /tmp/bazi-output.txt
 *   → 出力を 信頼できる万年暦サイト（azurewebsites 八字排盤等）と照合
 *
 * 候補日:
 *   - ランダム100件 + 立春境界 + 各節気の前後日
 */
import { threePillars, pillarToString } from "../lib/bazi";

const SOLAR_BORDERS = [
  // 各節気の翌日と前日（境界処理の正確性確認用）
  [2024, 2, 3], [2024, 2, 4], [2024, 2, 5],
  [2024, 3, 5], [2024, 3, 6],
  [2024, 4, 4], [2024, 4, 5],
  [2024, 5, 5], [2024, 5, 6],
  [2024, 6, 5], [2024, 6, 6],
  [2024, 7, 6], [2024, 7, 7],
  [2024, 8, 7], [2024, 8, 8],
  [2024, 9, 7], [2024, 9, 8],
  [2024, 10, 7], [2024, 10, 8],
  [2024, 11, 6], [2024, 11, 7],
  [2024, 12, 6], [2024, 12, 7],
  [2025, 1, 5], [2025, 1, 6],
];

function randomDates(n: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const seed = Date.now();
  let r = seed;
  const rand = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < n; i++) {
    const y = 1950 + Math.floor(rand() * 76);  // 1950..2025
    const m = 1 + Math.floor(rand() * 12);
    const dMax = new Date(y, m, 0).getDate();
    const d = 1 + Math.floor(rand() * dMax);
    out.push([y, m, d]);
  }
  return out;
}

function format(y: number, m: number, d: number) {
  const date = new Date(Date.UTC(y, m - 1, d));
  const p = threePillars(date);
  const ymdStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return `${ymdStr}\t${pillarToString(p.year)}\t${pillarToString(p.month)}\t${pillarToString(p.day)}`;
}

function main() {
  console.log("# 旭兆 命式エンジン検証（年柱・月柱・日柱）");
  console.log("# 形式: YYYY-MM-DD\\t年柱\\t月柱\\t日柱");
  console.log("");
  console.log("## 節気境界（25件）");
  for (const [y, m, d] of SOLAR_BORDERS) console.log(format(y, m, d));
  console.log("");
  console.log("## ランダム75件");
  for (const [y, m, d] of randomDates(75)) console.log(format(y, m, d));
}

main();
