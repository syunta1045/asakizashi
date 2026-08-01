# 朝しるべ — 引き継ぎ書（START HERE）

> このファイルを最初に読めば再開できる、という一枚。詳細は各 doc / メモリへリンクする。
> 最終更新: 2026-07-04

---

## 0. 30秒サマリ

- **朝しるべ (Asashirube)** = 毎朝1分の朝メモ＋夜の振り返りで自分のペースを整える**セルフケア日記アプリ**。
- **元は四柱推命の占いアプリだったが、Apple 4.3(b) で4連続 reject → セルフケアにピボットして突破**。占い要素は封印済み（§3 の鉄則を絶対に破らない）。
- **App Store 公開中**: `1.0.2 (Build 17)` が 2026-07-02 承認 → 自動公開。
- **次に出すもの**: `1.0.3` は**コード完成・git コミット済みだが未ビルド・未提出**（§5 の手順で出す）。
- bundle `jp.asakizashi.app` / ASC App ID `6772390191` / Expo `@syut/asakizashi` / GitHub `syunta1045/asakizashi`。

---

## 1. まず動かす（ローカル）

**node_modules は容量節約で削除されていることがある**（`tsc: command not found` が出たらこれ）。

```bash
cd ~/Desktop/projects/asakizashi
npm install --legacy-peer-deps   # 必須。peer 依存が固いので --legacy-peer-deps
npm run check                    # tsc(0) + eslint(--max-warnings 0) + jest。緑が正常（1.0.3時点=167 tests）
npm start                        # Expo Go + QR で実機表示（バックエンド無しでもオフラインで全機能動く）
```

- スタック: Expo SDK 54 / RN 0.81 / expo-router v6 / Zustand + AsyncStorage / RevenueCat(IAP) / Supabase(auth・同期・Edge Functions) / Gemini(解釈文バッチ)。
- 実機ローカルビルドの罠は [[reference_expo_local_device_build]]（Xcode版差）、写真送信は [[reference_expo_fetch_formdata_upload]]（XHRで送る）をメモリ参照。

---

## 2. 現在地（バージョン状況）

| バージョン | 状態 | 中身 |
|---|---|---|
| 1.0 (Build 15) | 承認済み・公開済み | セルフケアpiボット初版 |
| 1.0.1 | ASC に**ドラフト残置**（配信準備完了） | 1.0.2 に上位互換され不要。掃除してよい |
| **1.0.2 (Build 17)** | **2026-07-02 承認・公開中** | 脱占い大改修（オンボ短縮／課金de-occult／カレンダー記録化） |
| **1.0.3** | **コード完成・git済み・未ビルド未提出** | 品質改善＋見返し(lookback)＋リテンション。§5で出す |

`app.json` の `version` は現在 **1.0.3**。`ios.buildNumber` は EAS が自動採番（前回 17 → 次は 18）。

---

## 3. ⚠️ コンプラ鉄則（これを破ると審査で死ぬ）

**過去4回 reject された経緯があるので、以下は「仕様」であり好みで戻さない。**

1. **占い語彙を復活させない**: 運勢／鑑定／お告げ／吉凶（大吉・中吉…）／五行漢字（木火土金水）を **UI・通知・ストアメタ・LP** に出さない。`lib` に占い語サニタイザがある（穴を塞いだ履歴あり commit `0012f08`）。四柱推命エンジン(`lib/bazi.ts`)は残っているが**任意の補助入力**に降格済み。
2. **生年月日を必須にしない**（5.1.1(v)）: `birthDateProvided` フラグで管理。**未入力でも全 core 機能が動く**こと（今日/カレンダー/つながり/振り返り）。chart・命式系は empty state。
3. **課金価値に占いを混ぜない**（de-occult 済み）: 色・方角・数字（旧lucky）は撤去。有料＝**ユーティリティ**（通知カスタム／4テーマ深掘り／つながり無制限／30日90日の見返し=lookback）。
4. **同一機能の改名クローンを新規アプリで出さない**（4.3(a)重複でむしろ両方飛ぶ）。機能が実際に別物のフォークはOK（けさの一族方式）。詳細は [[project_asamei]]。

---

## 4. アーキテクチャ地図（ピボット後に効く所だけ）

**データの背骨は占いではなく「記録」**:
- `lib/journal.ts` — ★中核。記録(entries)/連続記録(getStreak)/気分集計(moodStats/moodSparkline/moodTrend/longestStreakInRange)。カレンダー・lookback・today が全部これを見る。
- `lib/store.ts` — プロフィール(Zustand+AsyncStorage)。`birthDateProvided`・`computePillars`(未入力ならno-op)。
- `lib/subscription.ts` — `FEATURE_LOCKS`。有料は限定的（脱占い後）。`isLocked(feature, isPremium)`。
- `lib/interpretation.ts` — 日次メッセージ。生年月日なし時は MBTI seed でフォールバック。
- `lib/sync.ts` — Supabase 同期。pillars 無しでも profile・記録を保存。
- `lib/bazi.ts` — 命式エンジン（検証済だが今は補助）。

**画面**:
- `app/(onboarding)/` — **3ステップ**（welcome→name→wake-up→themes→confirm）。birth/mbti/blood/gender は初回から外し、プロフィールの `app/edit/[field].tsx` で任意入力。
- `app/(tabs)/today.tsx` — メイン（今日のペース＋4テーマ深掘り＋今日の小さな準備3つ）。
- `app/calendar.tsx` — **記録ベース**（連続/今月/直近7日の気分の波、日タップで記録）。命式マーキングは撤去。
- `app/lookback.tsx` — **プレミアムの30日/90日見返し**（1.0.3新設）。
- `app/premium.tsx` — ペイウォール（価値=4テーマ/通知/つながり無制限/見返し）。
- `app/chart.tsx` — 「傾向メモ」（五行を言葉に和らげ、無料・二次画面）。

---

## 5. リリース手順（★今セッションで踏んだハマりどころ込み）

新バージョンを出す一連の流れ。**ASC はバージョン番号が作成後に編集できない**のが最大の罠。

### 5-1. ビルド＆ASCアップロード
```bash
# app.json の version を上げてから（例: 1.0.3）。buildNumber は自動採番。
cd ~/Desktop/projects/asakizashi
npx eas build --platform ios --profile production --auto-submit --non-interactive
```
- 約25分。`--auto-submit` で binary が ASC に上がる（TestFlight処理5〜10分）。審査提出はまだ。
- **EASビルドクレジットは月100%到達済み→従量課金**（1ビルド少額）。
- 認証は EAS の ASC API キー（`[Expo] EAS Submit`）で通る。Apple ログイン不要でビルドは回る。

### 5-2. ASC でバージョンを作って提出（Web / Chrome MCP でも手動でも）
1. TestFlight で当該 Build が **「提出準備完了」** になるまで待つ。
2. `配信` → サイドバー **「＋」** で **新規バージョン**を作成（version 文字列を入れる）。→ **前バージョンのスクショ7枚・説明・キーワード・連絡先・App Reviewメモを自動継承**する。
3. **ビルド**セクション「＋」→ 出てくる Build（**バージョンが一致するものだけ表示**）を選択→完了。
4. **「このバージョンの最新情報」(What's New)** を記入（更新版は必須）。
5. **保存** → **審査用に追加** → 右パネルで **審査へ提出**。
6. サイドバーが **「審査待ち」** になれば提出完了（最大48h・メール通知）。

### 5-3. ASC 操作の実務メモ
- **バージョン番号は作成後 grey out で編集不可**。だから「app.json の version」と「ASC のバージョン」を必ず一致させる（不一致だとそのビルドが選択肢に出ない）。
- ASC の React textarea は座標クリックがズレやすい。**JS で入れるのが確実**:
  ```js
  const t = document.querySelector('textarea[name="whatsNew"]'); // or description/promotionalText/notes
  const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;
  set.call(t, "本文"); t.dispatchEvent(new Event('input',{bubbles:true}));
  ```
- スクショは 6.5" 7枚。ASC のメディアに残るので新バージョンに自動継承される。
- 旧ドラフト版（1.0.1 の「配信準備完了」）は放置で無害。掃除するなら削除可。
- 詳細な当日手順は `docs/release-today.md` / `docs/release-checklist.md` / `docs/app-store-submission.md`。

---

## 6. すぐやる候補（次セッションの入口）

1. **1.0.3 を出す** — §5 の手順（build 18 → ASC 新規1.0.3 → What's New → 提出）。中身は CHANGELOG の [1.0.3] 参照。
2. **IAP を本番で効かせる** — 現状 v1 系は無料運用で IAP をゲートしている。RevenueCat の本番キー(`appl_...`)を配線すると購入が有効化（`IAP_AVAILABLE` 自動 true 系の実装）。見返し(lookback)・4テーマ・通知カスタムが有料導線。
3. **集客・ASO** — 公開済みなのでキーワード/スクショ/説明の最適化とSNS導線。
4. **README を pivot 後に更新** — 冒頭がまだ「四柱推命アプリ」表記（§3の実態と乖離）。
5. **旧1.0.1 ドラフト掃除**（ASC）。

---

## 7. アカウント・ID（秘密情報は載せない。在り処だけ）

- Apple Team: `RZK9B94UG5`（SHUNTA ENDO / Individual）。ASC App ID `6772390191`。
- Expo: account `syut` / project `@syut/asakizashi`。EAS の ASC API キーは EAS サーバ側に登録済み。
- GitHub: `github.com/syunta1045/asakizashi`（clean tree・最新 `e8401a2`）。
- 実キー（Gemini / RevenueCat / Supabase / Sentry）は **`.env` と EAS の production env** に入れる想定。**EXPO_TOKEN・PAT はメモリに古いものがあるが期限切れの可能性**→失効時は再発行。
- プライバシー/規約: `https://syunta1045.github.io/asakizashi/privacy/` ・ `/terms/`。

---

## 8. 参照

- **メモリ**（セッション横断の生きた記録・最重要）: `~/.claude/projects/-Users-syunta0327-Desktop-projects/memory/project_asamei.md`
- `CHANGELOG.md`（1.0.2 / 1.0.3 の中身）
- `docs/release-today.md` / `docs/release-checklist.md` / `docs/app-store-submission.md`
- `docs/REVIEW-2026-07-03.md`（出荷前レビュー）
- 関連メモリ: [[reference_expo_local_device_build]] / [[reference_expo_fetch_formdata_upload]] / [[reference_admob_age_rating_advertising]]（広告SDK入れる時）
