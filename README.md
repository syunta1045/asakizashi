# 朝しるべ — 今日を整える一行

朝のひとときに、今日を整える一行を届ける四柱推命アプリ。

## 状態

- **コードベース**: 100% 完成
- **品質指標**:
  - テスト: 129件 / 全合格
  - TypeScript エラー: 0
  - ESLint warnings: 0
  - 循環依存: 0
  - LOC: 約 6,000行 / 62ファイル / 26画面
- **β配信可能**: ✅（TestFlight / Internal Testing）
- **ストア提出可能**: ✅（提出ボタン押下のみ）
- **公開**: ストア審査待ち

リリース当日の手順は **`docs/release-today.md`** を参照。

## クイックスタート（実機で動かす）

### 1. 依存インストール
```bash
npm install --legacy-peer-deps
```

### 2. 起動
```bash
npm start
```

### 3. iPhone / Android で表示
- Expo Go アプリをインストール（無料）
- ターミナルに表示される QR コードを読み取り

→ オンボーディング7ステップ → 命式リビール → Today画面 まで動作します。
バックエンド未接続でもオフラインモードで全機能が動きます。

---

## ディレクトリ構成

```
asakizashi/
├── app/                   # 画面（expo-router）
│   ├── _layout.tsx        # Root（Splash・Notifications・ErrorBoundary）
│   ├── index.tsx          # 起動分岐
│   ├── welcome.tsx        # ◯ ウェルカム
│   ├── reveal.tsx         # ✦ 命式リビール
│   ├── chart.tsx          # 命式の詳細
│   ├── calendar.tsx       # 月の流れ（Premium限定）
│   ├── settings.tsx       # 設定
│   ├── premium.tsx        # 課金画面（7日無料トライアル）
│   ├── contact.tsx        # お問い合わせ
│   ├── (auth)/sign-in     # Apple / Google サインイン
│   ├── (onboarding)/      # 7ステップ
│   ├── (tabs)/            # ボトムタブ 5つ
│   ├── edit/[field]       # 設定編集
│   ├── relations/add      # つながり登録 3ステップ
│   └── legal/[type]       # 規約・ポリシー
├── components/
│   ├── OnboardShell.tsx
│   ├── PremiumLock.tsx
│   ├── ErrorBoundary.tsx
│   └── StateViews.tsx
├── lib/
│   ├── bazi.ts            # 命式計算エンジン（外部万年暦と照合済）
│   ├── ranking.ts         # 十二支ランキング
│   ├── relations.ts       # つながり + 三合六合冲ベース相性
│   ├── calendar.ts        # 月の流れ
│   ├── tone.ts            # MBTI×血液型×テーマのトーン調整
│   ├── interpretation.ts  # 解釈文取得（3層: Server→Cache→Mock）
│   ├── store.ts           # Zustand + AsyncStorage 永続化
│   ├── subscription.ts    # 課金状態
│   ├── journal.ts         # 振り返り日記
│   ├── notifications.ts   # ローカル通知 + push token登録
│   ├── supabase.ts        # Supabase クライアント
│   ├── revenuecat.ts      # RevenueCat ラッパー
│   ├── sync.ts            # ローカル⇔サーバー同期
│   ├── analytics.ts       # アナリティクス
│   ├── i18n.ts            # 多言語化（ja/en）
│   ├── haptics.ts         # 触覚フィードバック
│   ├── theme.ts           # デザイントークン
│   ├── dateUtils.ts       # 伝統暦表示
│   ├── legal.ts           # 規約・ポリシー本文
│   └── __tests__/         # Jest テスト
├── supabase/
│   ├── migrations/        # SQL マイグレーション
│   │   ├── 0001_initial_schema.sql
│   │   └── 0002_rls_policies.sql
│   └── functions/         # Edge Functions
│       ├── daily-message-batch/
│       └── revenuecat-webhook/
├── scripts/
│   ├── gemini-prompt.ts          # Gemini プロンプト定義
│   ├── generate-interpretations.ts  # 3,600件バッチ生成
│   ├── verify-bazi.ts            # 命式エンジン検証
│   └── build-assets.ts           # SVG → PNG
├── assets/                # アプリアイコン・スプラッシュ（生成済）
└── docs/
    ├── bazi-verification.md
    └── release-checklist.md
```

## テスト・解析

```bash
npx jest                # 80件全合格
npx tsc --noEmit        # 型エラー0
npx eslint app components lib   # warnings 0
npx madge --circular --extensions ts,tsx app/ components/ lib/   # 循環依存0
```

## 環境変数

`.env`（バージョン管理外）:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB=xxx.apps.googleusercontent.com
```

サーバー側（Supabase Edge Function 環境変数）:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
REVENUECAT_WEBHOOK_SECRET
```

## ストア提出までの流れ

`docs/release-checklist.md` 参照。

## 関連ドキュメント

- `../asamei-requirements.md` — 要件定義書 v1.2
- `../asamei-brand.md` — ブランドガイド v1.0
- `../asakizashi-design.md` — 技術設計書 v1.0
- `../asakizashi-store-listing.md` — ストア掲載文
- `docs/bazi-verification.md` — 命式エンジン外部照合記録
- `docs/release-checklist.md` — リリースチェックリスト
- `docs/release-today.md` — 当日リリース手順
- `docs/app-store-metadata.json` — App Store / Play Console 入力用データ

## ライセンス

Private. © 2026 朝しるべ Team.
