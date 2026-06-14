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

type Job = { src: string; dest: string; w: number; h: number; outDir?: string };

const JOBS: Job[] = [
  { src: "icon.svg",                 dest: "icon.png",          w: 1024, h: 1024 },
  { src: "splash.svg",               dest: "splash-icon.png",   w: 1242, h: 2688 },
  { src: "adaptive-foreground.svg",  dest: "adaptive-icon.png", w: 1024, h: 1024 },
  { src: "icon.svg",                 dest: "favicon.png",       w: 64,   h: 64 },
  { src: "og.svg",                   dest: "og-image.png",      w: 1200, h: 630 },
  { src: "feature-graphic.svg",      dest: "feature-graphic.png", w: 1024, h: 500 },
  // Notification icon (Android: monochrome + transparent recommended)
  { src: "icon.svg",                 dest: "notification-icon.png", w: 96, h: 96 },
  { src: "icon.svg",                 dest: "favicon.png",       w: 64,   h: 64,  outDir: PUBLIC_SITE },
  { src: "icon.svg",                 dest: "app-icon.png",      w: 512,  h: 512, outDir: PUBLIC_SITE },
  { src: "og.svg",                   dest: "og-image.png",      w: 1200, h: 630, outDir: PUBLIC_SITE },
  { src: "feature-graphic.svg",      dest: "feature-graphic.png", w: 1024, h: 500, outDir: PUBLIC_SITE },
];

async function build() {
  for (const job of JOBS) {
    const srcPath = path.join(SOURCE, job.src);
    const destPath = path.join(job.outDir || ASSETS, job.dest);
    if (!fs.existsSync(srcPath)) {
      console.warn(`⚠️  Skip: ${srcPath} not found`);
      continue;
    }
    await sharp(srcPath)
      .resize(job.w, job.h)
      .png()
      .toFile(destPath);
    console.log(`✓ ${job.src} → ${job.dest} (${job.w}×${job.h})`);
  }
  console.log("\n✅ All assets built");
}

build().catch((e) => { console.error(e); process.exit(1); });
