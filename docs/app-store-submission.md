# App Store 提出前チェック

App Store Connect に入力する内容の下書きです。提出時は、この内容と実際の App Store Connect / RevenueCat / Apple Developer の設定が一致していることを確認してください。

## 基本情報

- アプリ名: 朝しるべ
- App Store Connect App ID: `6772390191`
- Bundle ID: `jp.asakizashi.app`
- SKU: `asakizashi-001`
- 価格: 無料
- カテゴリ: ライフスタイル
- サブカテゴリ: ヘルスケア・フィットネス
- サブタイトル: 朝のセルフケア日記
- 年齢制限: 4+
- サポート URL: `https://syunta1045.github.io/asakizashi/support/`
- マーケティング URL: `https://syunta1045.github.io/asakizashi/`
- プライバシーポリシー URL: `https://syunta1045.github.io/asakizashi/privacy/`

## App Review メモ

```text
Guideline 4.3(b) のご指摘を受け、アプリの主要体験と表示文言をさらに見直しました。現在のビルドは、毎朝1分の朝メモ、今日のペース確認、夜の気分記録、つながりメモ、月間カレンダーを中心にしたセルフケア日記アプリとして構成しています。

今回の更新では、主要画面を朝の行動メモ、振り返り記録、テーマ別セルフケアに寄せました。ペース画面では朝・昼・夜の使い方を提示し、つながり画面では相手の気持ちを決めつけず、言葉選びと距離感を整えるメモとして表示します。サインインなしでも、オンボーディング後に主要機能を体験できます。Apple Sign in / Google Sign in は任意で、アカウント削除はアプリ内の「設定」から実行できます。

プレミアム機能はApp Storeのアプリ内課金で提供します。premium_yearlyには7日間の無料トライアルを設定しています。購入復元はプレミアム画面下部の「購入を復元」から確認できます。

App Description に利用規約、プライバシーポリシー、Apple標準EULAへの機能するリンクを追加しました。スクリーンショットはiOSシミュレータで撮り直し、Androidのステータスバー/ナビゲーションバーが写らない素材に差し替えました。
```

## App 内課金

Subscription Group:
- 表示名: 朝しるべプレミアム
- App Store Connect ID: `22108592`

Products:
- `premium_monthly`
  - Apple ID: `6772390718`
  - 種別: 自動更新サブスクリプション
  - 表示名: 朝しるべプレミアム 月額
  - 価格: 480円
  - App Store Connect status: 送信準備完了
- `premium_yearly`
  - Apple ID: `6772396801`
  - 種別: 自動更新サブスクリプション
  - 表示名: 朝しるべプレミアム 年額
  - 価格: 3,800円
  - App Store Connect status: 送信準備完了
  - Introductory Offer: 7日間無料トライアル（2026年5月23日開始、終了日なし、全175地域）

RevenueCat:
- Entitlement ID: `premium`
- Project ID: `0a92703c`
- App Store App: `朝しるべ (App Store)` / `jp.asakizashi.app`
- In-App Purchase Key: `9A5N37CJT6`（Valid credentials）
- App Store Products: `premium_monthly`, `premium_yearly`
- `premium_monthly` と `premium_yearly` を Entitlement `premium` に紐付け済み
- Offering `default`: `$rc_monthly` と `$rc_annual` に App Store 商品を紐付け済み
- iOS SDK Key を EAS production の `EXPO_PUBLIC_REVENUECAT_IOS_KEY` に設定済み
- App Store Connect API Key は未設定（商品は手動作成済み）
- RevenueCat アカウントのメール確認は未完了

## App Privacy 回答

トラッキング:
- 他社のAppやWebサイトを横断したトラッキング: No
- IDFA 使用: No

収集するデータ:
- Contact Info
  - Email Address
  - Linked to user: Yes
  - Purpose: App Functionality
- Contact Info
  - Name
  - Linked to user: Yes
  - Purpose: App Functionality
- Health
  - Health
  - Linked to user: Yes
  - Purpose: App Functionality
- Location
  - Coarse Location
  - Linked to user: Yes
  - Purpose: App Functionality
- User Content
  - Other User Content
  - Linked to user: Yes
  - Purpose: App Functionality
- Identifiers
  - User ID
  - Linked to user: Yes
  - Purpose: App Functionality
- Purchases
  - Purchase History
  - Linked to user: Yes
  - Purpose: App Functionality
- Usage Data
  - Product Interaction
  - Linked to user: Yes
  - Purpose: Analytics, App Functionality
- Diagnostics
  - Crash Data
  - Performance Data
  - Other Diagnostic Data
  - Linked to user: Yes
  - Purpose: Analytics, App Functionality
- Other Data
  - 生年月日、性別、MBTI、血液型、起床時間、関心テーマ
  - Linked to user: Yes
  - Purpose: App Functionality

補足:
- GPS / 正確な位置情報は取得しない
- 都道府県をユーザーが入力する場合のみ、朝のメッセージのパーソナライズ補助として利用
- App Store Connect の App Privacy は 2026-05-23 に公開済み
- App Accessibility は iPhone で「特定のアクセシビリティ機能をサポートしていない」として下書き保存済み（公開はリリース済みバージョンのみ可能）

## Capability 確認

Apple Developer の Identifier `jp.asakizashi.app` で有効化:
- Sign in with Apple
- Push Notifications
- In-App Purchase

ビルド前確認:
- `ios/app/app.entitlements` に `com.apple.developer.applesignin` がある
- `ios/app/app.entitlements` に `aps-environment` がある
- App Store Connect の Bundle ID と `app.json` の `ios.bundleIdentifier` が一致している

## 審査前 TestFlight 動作確認

- 初回起動からオンボーディング完了まで進める
- サインインなしで今日、ペース、つながり、振り返り、あなたタブを開ける
- Apple Sign in が成功する
- アカウント削除導線が設定内にある
- 通知許可ダイアログが過剰なタイミングで出ない
- プレミアム画面で商品情報が取得できる
- Sandboxで `premium_yearly` の無料トライアル開始が成功する
- 購入復元が成功する
- 課金なしで有料機能が解放されない
- プライバシーポリシー、利用規約、サポートページが HTTPS で開ける
- App Description に Apple 標準EULAリンク `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` を含める
- スクリーンショットに Android のステータスバー/ナビゲーションバーが写っていないことを確認する
