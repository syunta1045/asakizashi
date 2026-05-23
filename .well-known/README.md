# Universal Links / App Links 設定

このディレクトリは `https://asakizashi.app/.well-known/` で配信される必要があります。

## 配信時の確認

ホスティング先（Vercel / Cloudflare Pages 等）で以下を満たすこと：

1. **HTTPS 必須**（HTTP では Apple/Google が検証しない）
2. **Content-Type**:
   - `apple-app-site-association` → `application/json`（拡張子なしファイル）
   - `assetlinks.json` → `application/json`
3. **リダイレクト禁止** — `.well-known/` 直下を 200 OK で返すこと
4. **CORS** — Apple は不要、Android は anyOK

Vercel の場合 `vercel.json` 例:
```json
{
  "headers": [
    {
      "source": "/.well-known/apple-app-site-association",
      "headers": [{ "key": "Content-Type", "value": "application/json" }]
    }
  ]
}
```

## 投入時に置き換える値

### apple-app-site-association
- `TEAMID` → Apple Developer Team ID（10桁英数字）
  Apple Developer → Membership → Team ID で確認

### assetlinks.json
- `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` → Google Play 署名鍵の SHA-256 fingerprint
  Play Console → アプリ → 設定 → アプリの署名 → アプリ署名鍵証明書 → SHA-256 証明書
  形式: `XX:XX:...:XX`（64文字、コロン区切り、大文字）

## 検証方法

### iOS
```sh
curl -I https://asakizashi.app/.well-known/apple-app-site-association
# Apple の検証ツール: https://search.developer.apple.com/appsearch-validation-tool/
```

### Android
```sh
# Statement List Tester:
# https://developers.google.com/digital-asset-links/tools/generator
```

## アプリ側の設定

`app.json` に以下を追加（Team ID 確定後）:

```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:asakizashi.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            { "scheme": "https", "host": "asakizashi.app", "pathPrefix": "/today" },
            { "scheme": "https", "host": "asakizashi.app", "pathPrefix": "/journal" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```
