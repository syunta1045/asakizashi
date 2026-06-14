/**
 * lib/legal.ts の本文から HTML を生成
 * 出力: public-site/privacy.html, terms.html, support.html
 *       public-site/privacy/index.html, terms/index.html, support/index.html
 */
import * as fs from "fs";
import * as path from "path";
import { TERMS_TEXT, PRIVACY_TEXT } from "../lib/legal";

const SUPPORT_EMAIL = "syunta15032720@gmail.com";

const STYLES = `
  body { background: #FAF4E0; color: #231A1F; font-family: "Yu Mincho", serif;
    max-width: 720px; margin: 0 auto; padding: 40px 24px; line-height: 1.9; }
  h1 { font-size: 24px; margin-bottom: 24px; color: #9E2F2F; letter-spacing: 4px; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
  a { color: #A88340; }
  .back { display: inline-block; margin-bottom: 24px; }
`;

function html(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — 朝しるべ</title>
<style>${STYLES}</style>
</head>
<body>
<a href="/" class="back">← 朝しるべトップへ</a>
<h1>${title}</h1>
<pre>${body.replace(/</g, "&lt;")}</pre>
</body>
</html>`;
}

const SUPPORT_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>サポート — 朝しるべ</title>
<style>${STYLES}
  details { margin: 12px 0; padding: 12px 16px; background: #faebd0; border-radius: 8px; }
  summary { cursor: pointer; font-weight: 600; color: #9E2F2F; }
</style>
</head>
<body>
<a href="/" class="back">← 朝しるべトップへ</a>
<h1>サポート</h1>

<h2>よくあるご質問</h2>

<details>
  <summary>朝の通知が来ません</summary>
  <p>端末の通知設定と、アプリ内「設定」→「通知の設定」をご確認ください。朝の通知は、設定した起床時刻の少しあとに届きます。</p>
</details>

<details>
  <summary>生まれた時刻は入力しないのですか？</summary>
  <p>生まれた時刻の入力は不要です。生年月日などの基本情報をもとに、朝のメッセージと行動メモをあなた向けに整えます。</p>
</details>

<details>
  <summary>解約はどこからできますか？</summary>
  <p>iOSの場合は「設定」→「Apple ID」→「サブスクリプション」から解約できます。アプリを削除しただけでは解約されません。</p>
</details>

<details>
  <summary>アカウント・データを削除したい</summary>
  <p>アプリ内「設定」→「アカウントを削除」から実行できます。サーバー上のデータは最大30日以内に削除されます。</p>
</details>

<details>
  <summary>朝メモについて</summary>
  <p>本アプリの内容は自己理解と内省のきっかけです。医療・法律・金融などの専門的助言ではありません。</p>
</details>

<h2>お問い合わせ</h2>
<p>上記で解決しない場合は、以下のメールアドレスまでご連絡ください。</p>
<p><a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
</body>
</html>`;

function writeBoth(outDir: string, cleanPath: string, filename: string, contents: string): void {
  fs.writeFileSync(path.join(outDir, filename), contents);
  const cleanDir = path.join(outDir, cleanPath);
  fs.mkdirSync(cleanDir, { recursive: true });
  fs.writeFileSync(path.join(cleanDir, "index.html"), contents);
}

const outDir = path.join(__dirname, "..", "public-site");
writeBoth(outDir, "privacy", "privacy.html", html("プライバシーポリシー", PRIVACY_TEXT));
writeBoth(outDir, "terms", "terms.html", html("利用規約", TERMS_TEXT));
writeBoth(outDir, "support", "support.html", SUPPORT_HTML);
console.log("✓ public-site/privacy.html + /privacy/");
console.log("✓ public-site/terms.html + /terms/");
console.log("✓ public-site/support.html + /support/");
