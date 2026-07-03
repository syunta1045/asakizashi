// 朝しるべ App Store スクショ書き出し
// 使い方:  node render.mjs
// 事前に:  npm i -D puppeteer  （images フォルダに 01〜05.png を入れておく）
//
// 出力:    out/screenshot-01.png 〜 05.png  （各 1242×2688px = 6.5インチ用の正寸）

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch();
const page = await browser.newPage();
// deviceScaleFactor:1 で「CSSの1px = 画像の1px」。これで正寸が出る
await page.setViewport({ width: 1300, height: 2820, deviceScaleFactor: 1 });

await page.goto("file://" + path.join(__dirname, "index.html"), { waitUntil: "networkidle0" });
await page.evaluate(() => document.fonts.ready);

const panels = await page.$$(".panel");
if (panels.length === 0) {
  console.error("パネルが見つかりません。index.html を確認してください。");
  await browser.close();
  process.exit(1);
}

for (let i = 0; i < panels.length; i++) {
  const n = String(i + 1).padStart(2, "0");
  const file = path.join(outDir, `screenshot-${n}.png`);
  await panels[i].screenshot({ path: file });
  console.log("✓ 書き出し:", path.relative(__dirname, file));
}

await browser.close();
console.log("\n完了。out/ の5枚を App Store Connect の 6.5インチ枠に差し替えてください。");
