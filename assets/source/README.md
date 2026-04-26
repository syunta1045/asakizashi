# 旭兆 アセット元データ

## ファイル
- `icon.svg` (1024×1024) — App Store / Google Play 用アプリアイコン
- `splash.svg` (1242×2688) — スプラッシュ画面（iPhone 11 Pro Max 比率）
- `adaptive-foreground.svg` (1024×1024) — Android Adaptive Icon フォアグラウンド

## SVG → PNG 変換

### 必要なツール
```bash
brew install librsvg   # rsvg-convert
# または npm
npm install -g sharp-cli
```

### 変換コマンド
```bash
# アプリアイコン (Expo は icon.png を 1024×1024 で要求)
rsvg-convert -w 1024 -h 1024 icon.svg -o ../icon.png

# スプラッシュ
rsvg-convert -w 1242 -h 2688 splash.svg -o ../splash-icon.png

# Adaptive icon foreground
rsvg-convert -w 1024 -h 1024 adaptive-foreground.svg -o ../adaptive-icon.png

# Web favicon
rsvg-convert -w 64 -h 64 icon.svg -o ../favicon.png
```

### 確認
```bash
ls -la ../*.png
```

## デザイン仕様

| 要素 | 値 |
|------|-----|
| 背景グラデ | 朝焼け（#1F2E4A → #F5DDB5） |
| 太陽中心色 | #FFFCEF |
| 太陽光輪 | #FFE4A8 → 透明 |
| ブランド文字 | #FFFFFF（明朝） |
| ロゴ字面 | 「旭」一文字（500wt） |

## 色変更ガイド
ブランドカラーを変えたい場合は `theme.ts` の `dawnGradient` と
SVG内の `<linearGradient id="dawn">` を同期させてください。
