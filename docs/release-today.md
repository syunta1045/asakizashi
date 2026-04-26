# 旭兆 — 今日中に提出する手順

> **注意**: ストアでの一般公開は審査のため数日〜数週間かかります。
> 今日中に達成可能なゴール: **「提出ボタンを押した状態」 + 「TestFlight で実機に届けられる状態」**

---

## ⏱ 全体スケジュール（最速 8時間）

| 時刻 | 作業 | 所要 |
|------|------|------|
| 09:00 | Apple Developer / Google Play 登録 | 30分（承認待ち別） |
| 09:30 | ドメイン取得 + 法務ページホスティング | 30分 |
| 10:00 | Supabase + Gemini + RevenueCat セットアップ | 1.5時間 |
| 11:30 | Gemini で 3,600件解釈文生成 | 1時間（自動） |
| 12:30 | EAS Build 開始 + 昼食 | 1時間（ビルド中） |
| 13:30 | スクショ撮影（10枚） | 1.5時間 |
| 15:00 | App Store Connect / Play Console 設定 | 1.5時間 |
| 16:30 | 提出 + TestFlight β配信 | 30分 |
| 17:00 | 完了 |  |

---

## 0. 事前準備（やる前に）

- [ ] クレジットカード（Apple $99 + Google $25 + Domain $13 + 念のため $10）
- [ ] 本人確認書類（パスポート or 免許証）
- [ ] 銀行口座情報（収益受取用、後でOK）
- [ ] support@asakizashi.app のメール受信設定（任意）

---

## 1. Apple Developer Program 登録 (10分 + 承認1〜48時間)

```
URL: https://developer.apple.com/programs/enroll/
```

1. Apple ID でログイン → 2段階認証必須
2. 個人 (Individual) で登録（法人は D-U-N-S Number が必要で時間がかかる）
3. $99 USD 支払い
4. 承認メールを待つ（24時間以内が多い、時々48時間）

**承認待ちの間に**: Google Play 登録 → 開発作業を継続

---

## 2. Google Play Console 登録 (15分 + 承認1〜2日)

```
URL: https://play.google.com/console/signup
```

1. Google アカウントでログイン
2. 開発者種別: 個人
3. $25 USD 支払い
4. 本人確認書類アップロード（パスポート画像）
5. 1〜2日で承認

---

## 3. ドメイン取得 (5分・即時利用可能)

```
URL: https://www.namecheap.com/domains/registration/results/?domain=asakizashi.app
```

1. `asakizashi.app` をカートに追加（$12.98/年）
2. WhoisGuard 有効（無料、個人情報を隠す）
3. 支払い → DNS 即反映

### プライバシーポリシー / 利用規約のホスティング

最速ルート: Cloudflare Pages（無料・5分）

```bash
# 1. GitHub に asakizashi-public リポジトリ作成
# 2. lib/legal.ts の本文を index.html に埋め込み
# 3. https://pages.cloudflare.com で connect → デプロイ
# 4. Custom domain: asakizashi.app を設定
```

→ `https://asakizashi.app/privacy` と `https://asakizashi.app/terms` が公開される

---

## 4. Supabase プロジェクト作成 (15分)

```
URL: https://supabase.com/dashboard
```

1. New Project → 名前: `asakizashi-prod`、リージョン: `Northeast Asia (Tokyo)`
2. パスワード設定（強力なものを LastPass 等に保存）
3. プロジェクト作成（2分待ち）
4. SQL Editor で以下を実行:
   - `supabase/migrations/0001_initial_schema.sql` 全文コピペ → 実行
   - `supabase/migrations/0002_rls_policies.sql` 全文コピペ → 実行
5. Settings > API から:
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → サーバー用（.env.server に保存、絶対公開しない）

### Supabase Auth 設定
- Authentication > Providers
  - **Apple** を有効化 → Bundle ID: `jp.asakizashi.app`、Apple のサービス ID 等
  - **Google** を有効化 → OAuth Client ID 入力

### Edge Functions デプロイ
```bash
npx supabase login
npx supabase link --project-ref xxx
npx supabase functions deploy daily-message-batch --no-verify-jwt
npx supabase functions deploy revenuecat-webhook --no-verify-jwt
npx supabase functions deploy delete-account --no-verify-jwt

# Cron 設定（Supabase Dashboard > Edge Functions > Schedules）
# daily-message-batch: 0 0 * * *  (UTC 0:00 = JST 9:00)
```

---

## 5. Gemini API キー取得 + 解釈文生成 (1時間)

### キー取得 (5分)
```
URL: https://aistudio.google.com/app/apikey
```

1. Get API key → Create API key in new project
2. キーをコピー → `.env` の `GEMINI_API_KEY`

### 3,600件バッチ生成 (約45分・ ¥200程度)
```bash
cd asakizashi
npm install @google/genai zod tsx --save-dev --legacy-peer-deps

GEMINI_API_KEY=xxx \
SUPABASE_URL=xxx \
SUPABASE_SERVICE_ROLE_KEY=xxx \
  npx tsx scripts/generate-interpretations.ts
```

進捗が `[100/3600] done` のように出る。完了まで放置でOK。

---

## 6. RevenueCat 設定 (30分)

```
URL: https://app.revenuecat.com
```

1. 新規プロジェクト: `Asakizashi`
2. iOS App 追加: Bundle ID `jp.asakizashi.app`
   - App Store Connect API Key を生成して連携
3. Products 追加:
   - `premium_monthly` ¥480 / 月 / Auto-renewable Subscription
   - `premium_yearly` ¥3,800 / 年 / Auto-renewable Subscription（7日無料トライアル）
4. Entitlement 作成: `premium`（両 Product を紐付け）
5. iOS / Android API Keys を `.env` に設定
6. Webhook 設定:
   - URL: `https://xxx.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer <REVENUECAT_WEBHOOK_SECRET>`

---

## 7. App Store Connect 設定 (1.5時間)

```
URL: https://appstoreconnect.apple.com
```

### 7-1. Apple Developer ポータル (15分)
1. Identifiers → 新規 App ID: `jp.asakizashi.app`
   - Capabilities: **Sign in with Apple**, **Push Notifications**, **In-App Purchase**
2. Keys → 新規 Apple Push Notification 鍵 (.p8) を生成 → ダウンロード
   - RevenueCat / Expo に登録

### 7-2. App Store Connect で新規アプリ (15分)
1. My Apps → New App
2. Name: 旭兆
3. Bundle ID: jp.asakizashi.app
4. SKU: asakizashi-001
5. 保存

### 7-3. アプリ情報入力 (1時間)
- **アプリ情報**:
  - サブタイトル: `毎朝届く、あなただけの一行運勢`
  - キーワード: `asakizashi-store-listing.md` から
  - サポート URL: `https://asakizashi.app/support`
  - マーケティング URL: `https://asakizashi.app`
  - プライバシーポリシー: `https://asakizashi.app/privacy`
- **価格と販売状況**: 無料（IAP あり）
- **App Privacy**: 入力（収集データ宣言）
  - Identifiers: User ID（Apple Sign-in）
  - Contact Info: Email Address（Apple Sign-in）
  - Sensitive Info: 性別 / 生年月日（必要な場合）
  - Linked to identity: Yes
- **App Review**:
  - Sign-in info: Apple Test User を作成 → ログイン不要のため「No sign-in required」可
  - Notes: "占い・娯楽アプリ。すべての機能はサインインなしで体験可能。プレミアムは7日無料体験可。"
- **アプリ内課金**: `premium_monthly` / `premium_yearly` を申請（個別審査）

---

## 8. Google Play Console 設定 (1時間)

```
URL: https://play.google.com/console
```

1. アプリ作成: 旭兆 / Free / Apps
2. **アプリのコンテンツ**:
   - プライバシーポリシー URL
   - 広告: なし
   - アプリへのアクセス: 制限なし
   - データセーフティ: 入力
   - コンテンツレーティング: アンケート回答
   - ターゲット ユーザー: 一般
3. **ストア掲載情報**: Apple と同じ内容
4. 内部テスト → トラック作成 → 自分を追加

---

## 9. EAS Build (各30分)

### 事前準備
```bash
npm install -g eas-cli
eas login
eas build:configure
```

### iOS ビルド
```bash
eas build --platform ios --profile production
```
→ Apple Developer Portal で証明書・プロビジョニングが自動生成される
→ ビルド完了まで 20〜30分

### Android ビルド
```bash
eas build --platform android --profile production
```
→ App Bundle (.aab) が生成される

### Submit
```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## 10. スクショ撮影 (1.5時間)

iPhone Simulator で各画面を撮影:
```bash
# Xcode → Simulator
# Device → iPhone 16 Pro Max（6.9"）
# Cmd + S でスクショ保存（~/Desktop に出力）
```

撮影画面（10枚）:
1. ◯ ウェルカム画面
2. ① オンボーディング MBTI
3. ✦ 命式リビール
4. ② Today（御神籤）
5. ③ 順位（十二支ランキング）
6. ④ 月の流れカレンダー
7. ⑤ 命式の詳細
8. ⑥ つながり
9. ⑦ 振り返り日記
10. ⑧ プレミアム

App Store Connect / Play Console にアップロード

---

## 11. 提出 + TestFlight 配信

### TestFlight (即日配信可能)
1. App Store Connect → TestFlight → 自分のテスター追加
2. ビルド選択 → 利用規約同意 → β配信開始
3. iPhone で TestFlight アプリから受信
4. インストール → 全機能動作確認

### App Store 審査提出
1. アプリのバージョン → 提出
2. 「審査のために提出」ボタン
3. 1〜3週間待つ

### Google Play
1. 内部テスト → 製品版に昇格
2. 段階的公開: 5% から

---

## 完了！

これで「今日のうちに提出ボタンを押した状態」になります。

**実際の一般公開は審査次第（早ければ48時間、通常 1-2 週間）。**
