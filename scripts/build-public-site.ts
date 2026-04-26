/**
 * lib/legal.ts の本文から HTML を生成
 * 出力: public-site/privacy.html, terms.html
 */
import * as fs from "fs";
import * as path from "path";
import { TERMS_TEXT, PRIVACY_TEXT } from "../lib/legal";

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
<title>${title} — 旭兆</title>
<style>${STYLES}</style>
</head>
<body>
<a href="/" class="back">← 旭兆トップへ</a>
<h1>${title}</h1>
<pre>${body.replace(/</g, "&lt;")}</pre>
</body>
</html>`;
}

const outDir = path.join(__dirname, "..", "public-site");
fs.writeFileSync(path.join(outDir, "privacy.html"), html("プライバシーポリシー", PRIVACY_TEXT));
fs.writeFileSync(path.join(outDir, "terms.html"), html("利用規約", TERMS_TEXT));
console.log("✓ public-site/privacy.html");
console.log("✓ public-site/terms.html");
