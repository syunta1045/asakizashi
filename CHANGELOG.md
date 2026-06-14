# 朝しるべ Changelog

All notable changes to this project are documented here.

## [0.1.3] - 2026-04-26 — 100% Ready

### Added
- 用神（ようじん）/ 忌神（きしん）算出 + Chart 画面に表示
- 通知の詳細設定画面（朝/夜の独立トグル + 夜時刻5択 + 全停止）
- Apple Sign-in から名前・メール抽出 → ニックネーム自動シード
- analytics.setUserId / sentry.setUser をログイン状態と連動
- Settings: キャッシュ整理（解釈文キャッシュのみ削除）
- 通知用アイコン（Android 96×96）
- App Store メタデータ JSON テンプレ
- Today 御神籤カードに a11y ラベル
- マイルストーン達成時のハプティクス

### Quality
- ESLint 0 warnings 維持
- TypeScript 0 errors
- 循環依存 0
- テスト **82件 全合格**

## [0.1.2] - 2026-04-26

### Quality
- ESLint セットアップ + 全 warnings 解消（12件 → 0件）
- 統合テスト 12件追加（命式→今日のメッセージ全フロー / 通知時刻 / 相性判定 / カレンダー / マイルストーン / 気分統計）
- 既知の追加日付 / tone 全分岐 / ranking / calendar の単体テスト追加
- 循環依存（store ⇔ sync）をコールバック注入パターンで解消
- アクセシビリティラベル追加（Welcome / Reveal / Today / OnboardShell）
- CI ワークフローに ESLint + 循環依存チェック追加
- テスト総数: **80件全合格**

## [0.1.1] - 2026-04-26

### Added
- 大運（10年運）算出ロジック + Chart画面に8世代分表示
- カレンダー: 日付タップで干支・読み・分類を表示するモーダル
- つながり: ジャンルフィルタ（すべて / 大切な人 / 推し / 仕事 / 大切な日 / ペット 等）
- Today: ストリーク表示、Premium teaser バナー（無料ユーザーのみ）
- ヘルプ / FAQ 画面（9問）+ Settings からの導線
- 解釈文モック を 5件 → 10件に拡充

### Privacy
- iOS Privacy Manifest (`PrivacyInfo.xcprivacy`) を追加

### Tests
- 大運 / calcAge / currentDaiun のテスト3件追加（48件全合格）

## [0.1.0] - 2026-04-26 (β)

### Added
- 初期リリース
- 命式エンジン（年柱・月柱・日柱、五虎遁、立春・節気境界処理、五行バランス、十神）
- オンボーディング7ステップ（名前/生年月日/MBTI/血液型/性別/起床時間/関心テーマ）
- 命式リビール（Today到達前のセレモニー）
- Today画面（御神籤カード + 順位 + 行動指針 + ラッキー6 + シェア）
- 十二支ランキング画面
- つながり機能（8ジャンル: 大切な人/推し/仕事/大切な日/ペット/これから会う人/過去の人/場所）
- 月の流れカレンダー（Premium）
- 振り返り日記（4段階気分 + 連続記録 + マイルストーン）
- 命式詳細（三柱表 + 十神 + 五行バランス）
- プレミアム比較画面 + 7日無料トライアル
- 設定（プロフィール編集 / 通知 / プラン / コンテンツ / 法務 / アカウント削除）
- 朝の通知（起床+10分）+ 夜の振り返りリマインダー（21:00）
- Apple Sign-in / Google Sign-in
- ローカル ⇔ Supabase 同期
- データエクスポート（JSON）

### Tech
- Expo SDK 54 + React Native 0.81
- expo-router v6
- Zustand + AsyncStorage
- 朝焼けグラデーション + 御神籤カードのデザインシステム
- アナリティクス・Sentry スキャフォールド
- 多言語化（ja/en）スキャフォールド
- ErrorBoundary + Offline Banner
- 命式テスト 45/45 合格
