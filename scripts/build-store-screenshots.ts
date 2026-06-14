/**
 * 実機スクショを Google Play 用の縦長素材へ整える。
 *
 * 入力: assets/store/raw/*.png
 * 出力: assets/store/screenshots/*.png (1080x1920)
 */
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "assets", "store", "raw");
const OUT = path.join(ROOT, "assets", "store", "screenshots");
const RAW_STATUS_BAR = 56;
const RAW_NAV_BAR = 0;

const SHOTS = [
  { file: "01-today.png", title: "朝メモ", sub: "一日の始まりに、短いひとことを" },
  { file: "02-pace.png", title: "今日のペース", sub: "自分に合う歩幅をひと目で" },
  { file: "03-relations.png", title: "つながりメモ", sub: "距離感と言葉選びを整える" },
  { file: "04-journal.png", title: "夜の振り返り", sub: "一日の気分を静かに記録" },
  { file: "05-premium.png", title: "続けたくなる習慣", sub: "月間カレンダーやテーマ別ヒントへ" },
] as const;

function bg(title: string, sub: string): Buffer {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const safeSub = sub.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return Buffer.from(`
<svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1F2E4A"/>
      <stop offset="38%" stop-color="#5B4274"/>
      <stop offset="68%" stop-color="#C26E70"/>
      <stop offset="100%" stop-color="#F5DDB5"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="21%" r="50%">
      <stop offset="0%" stop-color="#F6C66F" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#F6C66F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#dawn)"/>
  <circle cx="540" cy="360" r="390" fill="url(#glow)"/>
  <text x="540" y="116" text-anchor="middle"
        font-family="Yu Mincho, Hiragino Mincho ProN, serif"
        font-size="54" font-weight="600" fill="#FFFFFF" letter-spacing="8">${safeTitle}</text>
  <text x="540" y="178" text-anchor="middle"
        font-family="Yu Mincho, Hiragino Mincho ProN, serif"
        font-size="25" fill="#FFF9EA" opacity="0.88" letter-spacing="3">${safeSub}</text>
</svg>`);
}

async function roundedPng(input: string): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const rawWidth = meta.width ?? 720;
  const rawHeight = meta.height ?? 1560;
  const cropTop = Math.min(RAW_STATUS_BAR, Math.max(0, rawHeight - 2));
  const cropHeight = Math.max(1, rawHeight - cropTop - RAW_NAV_BAR);
  const resized = await sharp(input)
    .extract({ left: 0, top: cropTop, width: rawWidth, height: cropHeight })
    .resize({ width: 720, height: 1560, fit: "cover" })
    .png()
    .toBuffer();
  const mask = Buffer.from(`
<svg width="720" height="1560" viewBox="0 0 720 1560" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="720" height="1560" rx="44" fill="#fff"/>
</svg>`);
  return sharp(resized).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

async function build() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const shot of SHOTS) {
    const src = path.join(RAW, shot.file);
    if (!fs.existsSync(src)) {
      console.warn(`skip: ${src}`);
      continue;
    }
    const phone = await roundedPng(src);
    const dest = path.join(OUT, shot.file);
    await sharp(bg(shot.title, shot.sub))
      .composite([
        {
          input: Buffer.from(`
<svg width="780" height="1620" viewBox="0 0 780 1620" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="24" width="720" height="1560" rx="48" fill="#160F18" opacity="0.26"/>
</svg>`),
          left: 150,
          top: 264,
        },
        { input: phone, left: 180, top: 282 },
      ])
      .png()
      .toFile(dest);
    console.log(`✓ ${dest}`);
  }
}

build().catch((e) => { console.error(e); process.exit(1); });
