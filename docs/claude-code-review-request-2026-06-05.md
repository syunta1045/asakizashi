# Claude Code Review Request - 2026-06-05

あなたはClaude Codeです。以下の背景を踏まえて、現在のリポジトリをレビューしてください。
レビューのみで、ファイル変更・送信・ビルド提出はしないでください。

## 背景

アプリ名は「朝しるべ」です。

Apple App Reviewで2026-06-05に Guideline 4.3(b) - Design - Spam として再度リジェクトされました。理由は、占い/星占い/fortune telling/zodiac report系の飽和カテゴリに見える、というものです。

以前のアプリでは、十二支ランキング、点数表示、干支/命式系の表現、深読み課金などが前面に出ており、App Reviewから「類似カテゴリの占いアプリに見える」と判断されるリスクがありました。

## こちらで実施した対応

- アプリの中心価値を「占い」ではなく「朝のセルフケア日記」に再定義。
- 今日画面を「朝メモ」に変更し、点数・吉凶・ランキング表示を主要体験から削除。
- 旧ランキング画面を「今日のペース」に変更し、朝/昼/夜の使い方・行動メモへ再設計。
- つながり画面は、相手の気持ちを断定する予測ではなく、言葉選びと距離感を整えるメモに変更。
- プロフィール/傾向/カレンダー/プレミアムの表示文言を、専門的な命式・干支レポートではなくセルフケア/記録/傾向メモに寄せた。
- 生成プロンプト `scripts/gemini-prompt.ts` も、占い語彙を本文・見出しに出さない方針へ変更。
- `docs/app-store-metadata.json`、`docs/app-store-submission.md`、`docs/app-review-response-2026-06-05.md`、公開サイト/サポート/規約/プライバシー文言を更新。
- App Storeスクリーンショットを `assets/store/appstore/iphone-65/` に再生成。
- 検証済み: `npm run typecheck`、`npm run lint`、`npm test -- --runInBand`、`git diff --check` はすべて成功。

## レビューしてほしい観点

1. Apple Guideline 4.3(b) の再リジェクトにつながりそうな、ユーザーに見える占い/星占い/干支/運勢/ランキング/吉凶/鑑定っぽい表現がまだ残っていないか。
2. App Storeメタデータ、App Review返信文、スクリーンショット方針に矛盾がないか。
3. プレミアム/課金/利用規約/プライバシーまわりで、審査上の説明不足や名称不一致がないか。
4. 実装面で、今回のコピー変更や画面再設計によって壊れていそうな導線・型・ロジックがないか。
5. 追加でやるべき最小修正があれば、優先度付きで具体的に指摘してください。

## 重点的に見てほしいファイル

- `app/(tabs)/today.tsx`
- `app/(tabs)/ranking.tsx`
- `app/(tabs)/relations.tsx`
- `app/(tabs)/profile.tsx`
- `app/calendar.tsx`
- `app/chart.tsx`
- `app/premium.tsx`
- `app/help.tsx`
- `lib/i18n.ts`
- `lib/interpretation.ts`
- `lib/dailyEngagement.ts`
- `lib/tone.ts`
- `scripts/gemini-prompt.ts`
- `docs/app-store-metadata.json`
- `docs/app-store-submission.md`
- `docs/app-review-response-2026-06-05.md`
- `docs/privacy-policy.md`
- `docs/terms.html`
- `public-site/index.html`
- `public-site/support.html`
- `public-site/privacy.html`
- `public-site/terms.html`
- `assets/store/appstore/iphone-65/`

## 出力形式

- Findings first。
- 重大度は H/M/L で付ける。
- ファイルと行番号をできるだけ示す。
- 追加修正が必要な場合は、最小限の修正方針を具体的に書く。
- 最後に「再提出前に必ずやること」を短くまとめる。
- 修正は実行せず、レビュー結果のみ返す。
