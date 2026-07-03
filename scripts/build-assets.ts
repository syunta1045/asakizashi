/**
 * SVG → PNG 変換ビルドスクリプト
 *
 * 使い方: npx tsx scripts/build-assets.ts
 */
import sharp from "sharp";
import * as path from "path";
import * as fs from "fs";

const ASSETS = path.join(__dirname, "..", "assets");
const SOURCE = path.join(ASSETS, "source");
const PUBLIC_SITE = path.join(__dirname, "..", "public-site");
// 現行アイコンデザイン（朝日）のマスター。source/icon.svg は旧・御神籤デザインなので使わない。
const MASTER_ICON = path.join(ASSETS, "icon.png");

type Job = { src?: string; master?: boolean; dest: string; w: number; h: number; outDir?: string };

const JOBS: Job[] = [
  // ── アイコン系：現行マスター icon.png から生成（source/icon.svg は旧デザインなので使用しない）──
  { master: true,                    dest: "favicon.png",         w: 64,   h: 64 },
  { master: true,                    dest: "adaptive-icon.png",   w: 1024, h: 1024 },
  // Notification icon (Android: monochrome + transparent recommended)
  { master: true,                    dest: "notification-icon.png", w: 96, h: 96 },
  { master: true,                    dest: "app-icon.png",        w: 512,  h: 512, outDir: PUBLIC_SITE },
  { master: true,                    dest: "favicon.png",         w: 64,   h: 64,  outDir: PUBLIC_SITE },
  // ── 非アイコンのグラフィック：従来どおり SVG から（※デザインは旧世代のまま。刷新時は source/*.svg を更新）──
  { src: "splash.svg",               dest: "splash-icon.png",     w: 1242, h: 2688 },
  { src: "og.svg",                   dest: "og-image.png",        w: 1200, h: 630 },
  { src: "feature-graphic.svg",      dest: "feature-graphic.png", w: 1024, h: 500 },
  { src: "og.svg",                   dest: "og-image.png",        w: 1200, h: 630, outDir: PUBLIC_SITE },
  { src: "feature-graphic.svg",      dest: "feature-graphic.png", w: 1024, h: 500, outDir: PUBLIC_SITE },
];

async function build() {
  for (const job of JOBS) {
    const srcPath = job.master ? MASTER_ICON : path.join(SOURCE, job.src!);
    const destPath = path.join(job.outDir || ASSETS, job.dest);
    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  Skip: ${srcPath} not found`);
      continue;
    }
    await sharp(srcPath)
      .resize(job.w, job.h)
      .png()
      .toFile(destPath);
    console.log(`✓ ${job.master ? "icon.png(master)" : job.src} → ${job.dest} (${job.w}×${job.h})`);
  }
  console.log("\n✅ All assets built");
}

build().catch((e) => { console.error(e); process.exit(1); });
