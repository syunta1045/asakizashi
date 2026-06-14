/**
 * App Store Connect iPhone 6.5-inch screenshots.
 *
 * Input: assets/store/raw/*.png
 * Output: assets/store/appstore/iphone-65/*.png (1242x2688)
 */
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "assets", "store", "raw");
const OUT = path.join(ROOT, "assets", "store", "appstore", "iphone-65");

const WIDTH = 1242;
const HEIGHT = 2688;
const PHONE_WIDTH = 900;
const PHONE_HEIGHT = 1950;
const PHONE_LEFT = Math.round((WIDTH - PHONE_WIDTH) / 2);
const PHONE_TOP = 390;
const RAW_STATUS_BAR = 56;
const RAW_NAV_BAR = 0;

const SHOTS = [
  { file: "01-today.png", title: "朝メモ", sub: "一日の始まりに、短いひとことを" },
  { file: "02-pace.png", title: "今日のペース", sub: "自分に合う歩幅をひと目で" },
  { file: "03-relations.png", title: "つながりメモ", sub: "距離感と言葉選びを整える" },
  { file: "04-journal.png", title: "夜の振り返り", sub: "一日の気分を静かに記録" },
  { file: "05-premium.png", title: "続けたくなる習慣", sub: "月間カレンダーやテーマ別ヒントへ" },
] as const;

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function background(title: string, sub: string): Buffer {
  const safeTitle = escapeXml(title);
  const safeSub = escapeXml(sub);

  return Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1F2E4A"/>
      <stop offset="34%" stop-color="#5C426F"/>
      <stop offset="66%" stop-color="#C46F70"/>
      <stop offset="100%" stop-color="#F5DDB5"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="52%">
      <stop offset="0%" stop-color="#F6C66F" stop-opacity="0.36"/>
      <stop offset="100%" stop-color="#F6C66F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dawn)"/>
  <circle cx="${WIDTH / 2}" cy="430" r="470" fill="url(#glow)"/>
  <text x="${WIDTH / 2}" y="150" text-anchor="middle"
        font-family="Hiragino Mincho ProN, Yu Mincho, serif"
        font-size="64" font-weight="600" fill="#FFFFFF" letter-spacing="8">${safeTitle}</text>
  <text x="${WIDTH / 2}" y="224" text-anchor="middle"
        font-family="Hiragino Mincho ProN, Yu Mincho, serif"
        font-size="31" fill="#FFF9EA" opacity="0.9" letter-spacing="3">${safeSub}</text>
</svg>`);
}

async function roundedPhone(input: string): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const rawWidth = meta.width ?? 720;
  const rawHeight = meta.height ?? 1560;
  const cropTop = Math.min(RAW_STATUS_BAR, Math.max(0, rawHeight - 2));
  const cropHeight = Math.max(1, rawHeight - cropTop - RAW_NAV_BAR);
  const resized = await sharp(input)
    .extract({ left: 0, top: cropTop, width: rawWidth, height: cropHeight })
    .resize({ width: PHONE_WIDTH, height: PHONE_HEIGHT, fit: "cover" })
    .png()
    .toBuffer();

  const mask = Buffer.from(`
<svg width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" viewBox="0 0 ${PHONE_WIDTH} ${PHONE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" rx="58" fill="#fff"/>
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

    const phone = await roundedPhone(src);
    const shadow = Buffer.from(`
<svg width="${PHONE_WIDTH + 90}" height="${PHONE_HEIGHT + 100}" viewBox="0 0 ${PHONE_WIDTH + 90} ${PHONE_HEIGHT + 100}" xmlns="http://www.w3.org/2000/svg">
  <rect x="45" y="36" width="${PHONE_WIDTH}" height="${PHONE_HEIGHT}" rx="64" fill="#160F18" opacity="0.28"/>
</svg>`);

    const dest = path.join(OUT, shot.file);
    await sharp(background(shot.title, shot.sub))
      .composite([
        { input: shadow, left: PHONE_LEFT - 45, top: PHONE_TOP - 36 },
        { input: phone, left: PHONE_LEFT, top: PHONE_TOP },
      ])
      .png()
      .toFile(dest);

    console.log(`created ${dest}`);
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
