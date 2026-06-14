# Android 単独リリース手順（朝しるべ）

iOS を後回しにして Google Play だけで先に出すための完全手順。
**所要: 実作業 1〜2日 / 待ち時間込み 1〜2週間**
**コスト: 約 ¥7,000（初回のみ）+ 月数千円**

iOS は後から追加可能（同じコードベース、`eas build -p ios` を回すだけ）。

---

## なぜ Android から始めるのが合理的か

| 項目 | iOS (Apple) | Android (Google) |
|---|---|---|
| 開発者登録費 | **$99/年（毎年更新）** | $25（買い切り） |
| 本人確認 | D-U-N-S 必要なケースあり | パスポートのみ |
| 審査リードタイム | 1〜3日 | 数時間〜2日（最近高速化） |
| 配信プラットフォーム | iPhone/iPad のみ | Android 端末 + Web Play |
| ベータテスト | TestFlight (招待制 90日) | Internal Testing (制限ゆるい) |

---

## Phase 0: 開発前提（コード側は既に完了済）

- ✅ `app.json` の `android.package`: `jp.asashirube.app`
- ✅ Adaptive icon, splash, notification icon
- ✅ `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` 投入箇所準備済
- ✅ `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID` 投入箇所準備済
- ✅ Apple Sign-In ボタンは `Platform.OS === "ios"` チェックで Android では非表示
- ✅ PrivacyInfo は iOS 専用なのでビルドに影響なし

→ **コード変更ゼロで Android 配信可**。

---

## Phase 1: アカウント登録（半日 + 本人確認待ち 1〜3日）

### Google Play Console 登録
1. https://play.google.com/console → 新規アカウント
2. **個人** で登録（法人は別途）
3. クレカで $25 支払い
4. **本人確認**: パスポート or 運転免許証 → 1〜3日で承認
5. 承認待ちの間に Phase 2〜3 を並行で進められる

### ドメイン取得（任意だが推奨）
Universal Links / メールサポート用。
- `asakizashi.app` を Cloudflare Registrar で取得（約 ¥2,000/年）
- Cloudflare Pages で `public-site/` をホスト（無料）
- `support@asakizashi.app` のメール転送設定（Cloudflare Email Routing 無料）

### Supabase / Gemini / RevenueCat / Sentry / Google OAuth
[docs/setup-services.md](setup-services.md) の手順そのまま。
- Google OAuth は **Android Client + Web Client の2つだけ** で OK（iOS Client は後回し）

---

## Phase 2: 環境構築（1〜2時間）

```sh
# .env を作成（テンプレ: .env.example）
cp .env.example .env
# 各キーを実値に書き換え
# 必要なのは Android 系のみ:
#   EXPO_PUBLIC_SUPABASE_URL / ANON_KEY
#   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
#   EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID / WEB
#   EXPO_PUBLIC_SENTRY_DSN
#   EXPO_PUBLIC_GEMINI_API_KEY (任意、ローカル実行時のみ)
```

```sh
# Supabase migrations & Edge Functions デプロイ
supabase login
supabase link --project-ref <REF>
supabase db push
supabase functions deploy daily-message-batch --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
supabase secrets set SUPABASE_URL=...
supabase secrets set REVENUECAT_AUTH_HEADER=...   # 自分で生成
supabase secrets set REVENUECAT_WEBHOOK_SECRET=... # RevenueCat HMAC
supabase secrets set GEMINI_API_KEY=...
```

```sh
# 解釈文 3,600件バッチ生成（30〜60分、約 ¥1,000）
GEMINI_API_KEY=AIza... npx tsx scripts/generate-interpretations.ts
```

---

## Phase 3: EAS Build（30分〜1時間）

```sh
# 初回のみ
npm install -g eas-cli
eas login
eas build:configure   # asakizashi のプロジェクトIDを発行

# preview ビルド (内部配布用 APK、自分の端末で動作確認)
eas build --platform android --profile preview

# 完了後、表示される URL から APK をダウンロード → adb install or QR コード
```

ビルド結果が緑になったら、実機にインストールして以下を確認：
- [ ] オンボーディング 7 ステップが通る
- [ ] today タブで朝メモカードが表示される
- [ ] Google サインインができる
- [ ] 通知許可 → 起床時刻+10分 にプッシュが来る（時刻を1分後に設定して検証）
- [ ] 設定 → サインアウト → 再ログインでデータ復元
- [ ] つながり 5件登録 → 6件目で paywall

問題があれば修正 → 再ビルド。

---

## Phase 4: Google Play 申請（1〜2時間 + 審査 1〜2日）

### 4-1. Play Console でアプリ作成
1. https://play.google.com/console → **アプリを作成**
2. デフォルト言語: 日本語（日本）
3. **アプリ名**: 朝しるべ
4. アプリ or ゲーム: アプリ
5. 無料 or 有料: 無料（アプリ内課金あり）

### 4-2. ストア掲載情報
[docs/app-store-metadata.json](app-store-metadata.json) の内容を貼り付け：
- 短い説明（80文字以内）
- 詳しい説明（4,000文字以内）
- アプリのアイコン（512×512 PNG）→ `assets/icon.png` から生成済
- フィーチャーグラフィック（1024×500 PNG）→ `assets/feature-graphic.png` からアップロード
- スクリーンショット（最低 2枚、推奨 4〜8枚）→ 要作成

### 4-3. ストア素材を作る
今あるもの:
- `assets/icon.png` (1024×1024)
- `assets/og-image.png` (1200×630)
- `assets/feature-graphic.png` (1024×500)

足りないもの:
- **スクリーンショット** 1080×1920 を 4〜8枚: 実機 or シミュレータでスクショ
  推奨シーン:
  1. オンボーディング welcome
  2. today タブ（朝メモ）
  3. 傾向メモ
  4. つながり登録一覧
  5. 振り返り mood + 連続記録
  6. プレミアム比較表

```sh
# シミュレータ起動
eas build --platform android --profile preview --local   # ローカルビルドなら
# or APK を実機にインストール後、画面ごとに Volume Down + Power でスクショ
```

### 4-4. コンテンツレーティング
- 質問票に回答（セルフケア・ライフスタイル用途、暴力なし、性的表現なし）
- 結果は IARC: Everyone / 全年齢

### 4-5. データセーフティ
- 収集データ: 個人ID（Supabase auth_id）、生年月日、性別（任意）、メール
- 共有先: なし
- 暗号化: 通信は TLS、保存は Supabase 標準暗号化
- 削除リクエスト: 「設定 > アカウント完全削除」または `support@asakizashi.app`

### 4-6. プライバシーポリシー URL
- `https://asakizashi.app/privacy.html`（ドメイン取得後に有効化）

### 4-7. アプリ内購入の設定
1. **収益化 > アプリ内アイテム > 定期購入**
2. `premium_monthly` ¥480/月 + 7日間トライアル
3. `premium_yearly` ¥3,800/年 + 7日間トライアル
4. RevenueCat と紐付け（Project Settings → Apps → Google → Service Account JSON 投入）

### 4-8. EAS Submit
```sh
# Internal Testing トラックに自動送信
eas submit --platform android --profile production
# Service Account JSON は eas.json で参照済（./google-play-service-account.json）
```

または手動で Play Console から AAB をアップロード。

### 4-9. 内部テスト → 本番公開
1. **テスト > 内部テスト**: 自分の Gmail を追加 → 招待リンクで実機にインストール
2. 1〜2 日触って問題なければ
3. **製品版 > リリースを作成** → 段階的展開（10% → 50% → 100%）

審査は **数時間〜2日** で結果が出ます。

---

## Phase 5: 公開後（運用）

- **Crashlytics 代わりに Sentry**: ダッシュボードでエラー監視
- **PostHog**: ユーザー行動分析（設定済なら自動）
- **RevenueCat**: 購入数・MRR・解約率
- **Play Console**: ANR・クラッシュ率・評価

### ダウンロードリンクを LP に反映
[public-site/index.html](../public-site/index.html) の TODO を更新：
```html
<a href="https://play.google.com/store/apps/details?id=jp.asashirube.app">Google Play</a>
```

### iOS 追加（後日）
気が向いたら Apple Developer 登録 → `eas build --platform ios --profile preview` → TestFlight → App Store。
コード変更は不要、設定値の追加だけ。

---

## 最短スケジュール例

| Day | 作業 |
|---|---|
| 1 | Google Play Console 登録（本人確認待ち開始）+ ドメイン取得 |
| 2 | Supabase / Gemini / RevenueCat / Sentry アカウント作成 |
| 3 | 各種キーを `.env` 投入 + Supabase migrations / Functions デプロイ |
| 4 | Gemini で解釈文 3,600件バッチ生成 + 目視レビュー |
| 5 | EAS preview ビルド → 実機検証 |
| 6 | ストア素材（スクショ + フィーチャーグラフィック）作成 |
| 7 | Play Console 申請 |
| 8〜9 | 審査待ち |
| 10 | **公開** 🎉 |

---

## よくある詰まりどころ

| 症状 | 原因 | 対処 |
|---|---|---|
| EAS build が SHA-1 mismatch | Google OAuth Android Client の SHA-1 が Play 署名鍵と違う | Play Console → 設定 → アプリ署名 → SHA-1 をコピーして OAuth Client に追加 |
| 実機で課金できない | RevenueCat の Service Account 紐付け漏れ | RC Dashboard → Apps → Google → JSON 投入 |
| 通知が来ない | Expo Push Token が Supabase に登録されてない | サインインした状態で `registerPushToken()` が呼ばれているか確認 |
| 審査リジェクト「データセーフティ整合性なし」 | Play Console の宣言と実装が違う | データセーフティ宣言を実装に合わせて修正 |

---

## 質問あれば

- 各 Phase で詰まったら個別に手順を細かく説明可能
- ストア素材は SVG ベースの自動生成スクリプト追加もできます（`scripts/build-assets.ts` 参照）
