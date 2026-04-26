# Maestro E2E テスト

クロスプラットフォーム E2E テスト。実機 or シミュレータで動かす。

## セットアップ

```sh
# Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash
```

## 実行

```sh
# シミュレータ起動後
maestro test .maestro/onboarding.yaml
maestro test .maestro/share-flow.yaml

# 全部
maestro test .maestro/
```

## CI で動かす場合

GitHub Actions の `.github/workflows/e2e.yml` で:
```yaml
- uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: build/asakizashi.apk
```

Maestro Cloud（無料枠 100 flows/月）は実機クラウドで実行してくれる。
