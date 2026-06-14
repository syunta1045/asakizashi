# 朝しるべ リリースチェックリスト

## Phase 1: 開発者アカウント取得（β配信前）

### Apple Developer Program
- [ ] https://developer.apple.com/programs/ から年間 $99 で登録
- [ ] D-U-N-S Number 取得（個人なら不要、法人は必須）
- [ ] 2段階認証設定
- [ ] Team ID をメモ
- [ ] App Store Connect にログインできることを確認

### Google Play Console
- [ ] https://play.google.com/console から $25 で登録
- [ ] 本人確認（パスポート等）
- [ ] アプリ署名鍵のクラウド管理同意

### ドメイン
- [ ] `asakizashi.app` を Namecheap or Cloudflare で取得（$13/年）
- [ ] `support@asakizashi.app` のメール転送設定（任意）
- [ ] HTTPS 証明書（ホスティング先で自動: Vercel / Cloudflare Pages）

### サードパーティ
- [ ] Supabase プロジェクト作成（東京リージョン推奨）
- [ ] Supabase の URL / Anon Key / Service Role Key を控える
- [ ] Google Cloud Console で Gemini API 有効化 + キー発行
- [ ] RevenueCat プロジェクト作成
- [ ] Sentry プロジェクト作成（任意）
- [ ] PostHog プロジェクト作成（任意）

---

## Phase 2: アプリ設定

### app.json / 環境変数
- [ ] `expo.ios.bundleIdentifier`: `jp.asakizashi.app` ✓ 設定済
- [ ] `expo.android.package`: `jp.asashirube.app` ✓ 設定済
- [ ] `expo.scheme`: `asakizashi` ✓ 設定済
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- [ ] `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS`
- [ ] `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID`
- [ ] `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB`

### EAS Submit シークレット（eas.json は環境変数参照）
配信時に `eas.json` の `submit.production.ios` が `$APPLE_ID` 等を参照します。EAS にシークレットを登録してください:

```sh
eas secret:create --scope project --name APPLE_ID --value your-apple-id@example.com
eas secret:create --scope project --name ASC_APP_ID --value 0000000000  # App Store Connect の App ID（数字10桁）
eas secret:create --scope project --name APPLE_TEAM_ID --value ABCDE12345
```

確認: `eas secret:list`

### Supabase Edge Function シークレット
```sh
supabase secrets set REVENUECAT_WEBHOOK_SECRET=...   # RevenueCat ダッシュボードで発行
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   # Supabase Settings → API
supabase secrets set GEMINI_API_KEY=...              # Google AI Studio
```

### Supabase セットアップ
- [ ] `supabase/migrations/0001_initial_schema.sql` 適用
- [ ] `supabase/migrations/0002_rls_policies.sql` 適用
- [ ] `supabase/functions/daily-message-batch` デプロイ
- [ ] `supabase/functions/revenuecat-webhook` デプロイ
- [ ] Cron ジョブで daily-message-batch を 0:00 UTC に毎日実行

### Gemini 解釈文生成
- [ ] `scripts/generate-interpretations.ts` を実行（3,600件）
- [ ] interpretations テーブルに 3,600 行存在することを確認
- [ ] サンプル10件を目視レビュー

### Apple Developer Console
- [ ] App ID 登録: `jp.asakizashi.app`
- [ ] Capabilities を有効化: **Sign in with Apple**, **Push Notifications**, **In-App Purchase**
- [ ] Provisioning Profile に上記 Capabilities が反映されていることを確認
- [ ] Apple Push Notification 鍵（.p8）を生成し、Expo / EAS 側に登録
- [ ] App Store Connect で新規アプリ作成
- [ ] TestFlight Internal Testing を有効化

### Google Play Console
- [ ] アプリ作成: `jp.asashirube.app`
- [ ] Internal Testing トラックに最初のビルドをアップロード
- [ ] アプリ署名鍵を作成

### RevenueCat
- [ ] App Store Connect / Play Console を RevenueCat に連携
- [x] RevenueCat iOS App Store App 作成: `jp.asakizashi.app`
- [x] RevenueCat In-App Purchase Key 連携
- [x] App Store Connect で Subscription Group 作成: `朝しるべプレミアム`
- [x] Product 作成: `premium_monthly` (¥480), `premium_yearly` (¥3,800)
- [x] `premium_yearly` に 7日間の無料トライアルを設定
- [x] Entitlement 作成: `premium`
- [x] App Store側 `premium_monthly` / `premium_yearly` を Entitlement `premium` に紐付け
- [x] Offering `default` の `$rc_monthly` / `$rc_annual` に App Store商品を紐付け
- [x] RevenueCat iOS SDK Key を `EXPO_PUBLIC_REVENUECAT_IOS_KEY` に設定
- [ ] Webhook URL を Supabase Edge Function に設定

---

## Phase 3: ストア素材

### アプリアイコン ✓ 完了
- [x] `assets/icon.png` 1024×1024
- [x] `assets/adaptive-icon.png` 1024×1024 (Android)
- [x] `assets/splash-icon.png` 1242×2688
- [x] `assets/feature-graphic.png` 1024×500 (Google Play)

### スクリーンショット（実機 or シミュレータで撮影）
iOS 必要サイズ:
- [ ] 6.9" (iPhone 16 Pro Max): 1320 × 2868 — 必須
- [ ] 6.5" (iPhone 11 Pro Max): 1284 × 2778 — 推奨
- [ ] 5.5" (iPhone 8 Plus): 1242 × 2208 — 任意

Android 必要サイズ:
- [ ] スマホ: 1080 × 1920 以上 — 必須
- [ ] タブレット: 任意

### 撮影内容（10枚案 — store-listing.md 参照）
- [ ] 1. ロック画面通知（朝6:40）
- [ ] 2. 今日タブ（朝メモ）
- [ ] 3. 初回朝メモ
- [ ] 4. 今日のペース
- [ ] 5. つながり一覧
- [ ] 6. 月間カレンダー
- [ ] 7. 傾向メモ
- [ ] 8. 振り返り日記
- [ ] 9. プレミアム比較
- [ ] 10. オンボーディング MBTI

### ストア掲載文 ✓ 完了
- [x] アプリ名・サブタイトル・キーワード・説明文（asakizashi-store-listing.md）

---

## Phase 4: 法務

### プライバシー
- [x] プライバシーポリシー作成 ✓
- [x] 利用規約作成 ✓
- [ ] 弁護士レビュー（推奨）
- [ ] HTTPSでホスティング: `https://syunta1045.github.io/asakizashi/privacy/`, `https://syunta1045.github.io/asakizashi/terms/`
- [ ] App Store Connect の App Privacy を入力（`docs/app-store-submission.md` を参照）
- [ ] Google Play の データセーフティ セクション記入

### App Tracking Transparency (iOS 14.5+)
- [x] トラッキングしない設計。ATT ダイアログ / `NSUserTrackingUsageDescription` は不要
- [ ] App Store Connect の App Privacy で「他社のAppやWebサイトを横断したトラッキング」は **No** にする

---

## Phase 5: ビルド & 配信

### EAS Build
- [ ] `eas login` 完了
- [ ] `eas build:configure`
- [ ] `eas build --platform ios --profile production`
- [ ] `eas build --platform android --profile production`

### TestFlight β配信
- [ ] 内部テスター 1名（自分）追加
- [ ] β配信開始
- [ ] 自分の iPhone にインストール → 全機能テスト
- [ ] β5名追加（友人）
- [ ] フィードバック収集（1週間）

### Google Play Internal Testing
- [ ] 内部テスター 5名追加
- [ ] 段階的公開設定

### App Store 提出
- [ ] App Review 用メモを入力（`docs/app-store-submission.md` を参照）
- [ ] サインインなしで主要機能を確認できることをTestFlightで確認
- [ ] Apple Sign in が成功することをTestFlightで確認
- [ ] IAP購入・購入復元がSandboxで成功することをTestFlightで確認
- [ ] ビルド選択 + 提出
- [ ] 審査待ち（1〜3週間）
- [ ] 審査でリジェクトされた場合、対応 → 再提出

### Google Play 公開
- [ ] Production トラックに昇格
- [ ] 段階的公開: 5% → 20% → 100%

---

## Phase 6: ローンチ後

- [ ] Sentry でクラッシュ監視
- [ ] PostHog でファネル分析
- [ ] App Store / Google Play レビューに返信
- [ ] β期間のフィードバックを反映してアップデート
- [ ] SNS発信開始（X, Instagram, TikTok）
