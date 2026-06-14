# 朝しるべ アセット元データ

## ファイル
- `icon.svg` (1024×1024) — App Store / Google Play 用アプリアイコン
- `splash.svg` (1242×2688) — スプラッシュ画面（iPhone 11 Pro Max 比率）
- `adaptive-foreground.svg` (1024×1024) — Android Adaptive Icon フォアグラウンド
- `feature-graphic.svg` (1024×500) — Google Play フィーチャーグラフィック
- `og.svg` (1200×630) — Web / SNS 共有画像

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

# Google Play フィーチャーグラフィック
rsvg-convert -w 1024 -h 500 feature-graphic.svg -o ../feature-graphic.png
```

### 確認
```bash
ls -la ../*.png
```

## デザイン仕様

| 要素 | 値 |
|------|-----|
| 背景 | 夜明けの空（#0B1422 → #D99B68） |
| カード | #FFF9EA → #EBD0A0 |
| 太陽 | #FFF6DA → #F1B95F |
| ロゴ字面 | 朝に届くカード（文字なし） |

## 色変更ガイド
ブランドカラーを変えたい場合は `theme.ts` の `dawnGradient` と
SVG内の `<linearGradient id="dawn">` を同期させてください。
