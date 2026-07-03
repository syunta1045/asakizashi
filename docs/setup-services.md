# 外部サービス登録手順

朝しるべを本番配信するために必要な5サービスの登録 → キー発行 → アプリ/Edge Function への投入までの手順。

所要時間目安：合計 **2〜3時間**（待ち時間を除く）

---

## 1. Supabase（DB / 認証 / Edge Function）

### 登録
1. https://supabase.com/dashboard にアクセス
2. GitHub アカウントでサインイン → New project
3. **Organization**: 自分のアカウント
4. **Project name**: `asakizashi`
5. **Database password**: 強いパスワードを生成（パスワードマネージャーに保存）
6. **Region**: **Northeast Asia (Tokyo)** ← 重要
7. **Pricing plan**: Free（あとで Pro $25/月にスケール可）
8. 作成完了まで 2分

### キー取得
Project Settings → API:
- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → Edge Function 用（**クライアントには絶対に渡さない**）

### Migrations 適用
```sh
brew install supabase/tap/supabase   # 初回のみ
supabase login                        # ブラウザで認証
supabase link --project-ref <PROJECT_REF>   # 上記 URL のサブドメイン部分
supabase db push                      # migrations を適用
```

### Edge Functions デプロイ
```sh
supabase functions deploy daily-message-batch --no-verify-jwt
supabase functions deploy revenuecat-webhook --no-verify-jwt
supabase functions deploy delete-account     # JWT 認証あり
```

### Edge Function 用シークレット投入
```sh
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
# RevenueCat / Gemini のキーは下記項目で発行後に投入
```

### Cron 設定（daily-message-batch を 0:00 UTC = JST 9:00 に毎日実行）
⚠️ daily-message-batch は `CRON_SECRET` の Bearer 認証必須（未設定だと全リクエスト401 = fail closed）。
デプロイ前に必ず `supabase secrets set CRON_SECRET=<ランダム値>` を実行し、Cron 側にも同じ値のヘッダを付ける。

Supabase Dashboard → Database → Webhooks → Cron Jobs:
- Function: `daily-message-batch`
- Schedule: `0 0 * * *`
- HTTP Headers: `Authorization: Bearer <CRON_SECRET>`

順序: ① `secrets set CRON_SECRET` → ② Cron のヘッダ設定 → ③ `functions deploy`（逆順だと生成が401で止まる）

---

## 2. Google Cloud（Gemini API）

### Gemini API キー
1. https://aistudio.google.com/apikey
2. Google アカウントでサインイン
3. **Create API key** → Project: `asakizashi`
4. キーをコピー → `GEMINI_API_KEY` として保存

### Edge Function に投入
```sh
supabase secrets set GEMINI_API_KEY=AIza...
```

### 解釈文 3,600件バッチ生成
ローカルで実行：
```sh
GEMINI_API_KEY=AIza... npx tsx scripts/generate-interpretations.ts
```

実行時間: 約 30〜60分（Gemini 2.5 Flash で約 1,000円分）。
完了後、Supabase の `interpretations` テーブルに 3,600 行入っていることを確認。

---

## 3. Google OAuth（Google Sign-In 用）

### OAuth 同意画面
1. https://console.cloud.google.com/apis/credentials/consent
2. **External** で作成
3. **App name**: 朝しるべ
4. **User support email**: `support@asakizashi.app`
5. **Authorized domains**: `asakizashi.app`
6. **Scopes**: `email`, `profile`, `openid`

### Client ID 3つ発行
https://console.cloud.google.com/apis/credentials → Create Credentials → OAuth client ID

| Type | Application | Bundle ID / Origin | 環境変数 |
|---|---|---|---|
| iOS | iOS | `jp.asakizashi.app` | `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS` |
| Android | Android | `jp.asashirube.app` + SHA-1 | `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID` |
| Web | Web application | `https://<ref>.supabase.co/auth/v1/callback` | `EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB` |

Web Client ID は Supabase Dashboard → Authentication → Providers → Google でも設定。

---

## 4. RevenueCat（課金）

### 登録
1. https://app.revenuecat.com/signup
2. **Project name**: 朝しるべ
3. **Apps を追加**:
   - iOS: `jp.asakizashi.app` + In-App Purchase Key
   - Android: `jp.asashirube.app` + Google Play Service Account JSON

### Products / Entitlement 作成
1. **Products**:
   - `premium_monthly`（月額 ¥480）
   - `premium_yearly`（年額 ¥3,800 / 7日間無料トライアル付き）
2. **Entitlement**: `premium`
3. **Offerings → Current**: `default`
   - `monthly` パッケージ → `premium_monthly`
   - `annual` パッケージ → `premium_yearly`

### API キー取得
Project Settings → API keys:
- iOS: `appl_...` → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- Android: `goog_...` → `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

### Webhook 設定
Project Settings → Integrations → Webhooks:
- **URL**: `https://<ref>.supabase.co/functions/v1/revenuecat-webhook`
- **Authorization Header**: `Bearer <RANDOM_LONG_STRING>` ← 自分で生成
- **Events**: All（最初は全部）

### Edge Function に投入
```sh
supabase secrets set REVENUECAT_AUTH_HEADER=<RANDOM_LONG_STRING>
supabase secrets set REVENUECAT_WEBHOOK_SECRET=<HMAC_SECRET_FROM_RC>
```
※ `REVENUECAT_WEBHOOK_SECRET` は RevenueCat Webhook 設定の「Add HMAC signing secret」から取得

---

## 5. Sentry（エラー監視）

### 登録
1. https://sentry.io/signup
2. **Platform**: React Native
3. **Project name**: `asakizashi`
4. **Team**: Default

### DSN 取得
Project Settings → Client Keys (DSN) → コピー
→ `EXPO_PUBLIC_SENTRY_DSN`

### Source Map アップロード（任意、本番ビルド時）
EAS Build Hook で `npx sentry-expo-upload-sourcemaps`。詳細は Expo の Sentry 統合ドキュメント参照。

---

## 6. 環境変数まとめ → `.env`

```sh
# === アプリ側 (.env in project root) ===
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_IOS=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_ANDROID=...apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_OAUTH_CLIENT_ID_WEB=...apps.googleusercontent.com
EXPO_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
EXPO_PUBLIC_POSTHOG_KEY=phc_...        # 任意
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com   # 任意
```

---

## 7. EAS Build / Submit シークレット

App Store Connect でアプリ作成 → ASC App ID 取得後：

```sh
eas secret:create --scope project --name APPLE_ID --value your-apple-id@example.com
eas secret:create --scope project --name ASC_APP_ID --value 0000000000   # 数字10桁
eas secret:create --scope project --name APPLE_TEAM_ID --value ABCDE12345
```

確認: `eas secret:list`

---

## チェック後

### 動作確認
```sh
npm run check                     # typecheck + lint + test 全通過
npx expo start                    # ローカルで起動確認
eas build --profile preview       # 内部配布ビルド
eas submit --profile production   # ストア提出
```

### よくある詰まりポイント
- **Supabase RLS** — 自分の auth.uid() で SELECT/INSERT できるかコンソールで確認
- **OAuth redirect URI mismatch** — Supabase の callback URL と OAuth Client の URI が完全一致
- **RevenueCat sandbox** — TestFlight ビルドは sandbox 課金で実行される（実課金されない）
- **iOS UDID** — Apple Developer に実機 UDID を登録しないと preview ビルドが実機で動かない
