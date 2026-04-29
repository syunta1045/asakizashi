/**
 * Expo Config Plugin: Android assets フォルダに adi-registration.properties を配置する。
 *
 * Google Play Console の Android Developer Verification で要求される
 * adi-registration.properties を、ビルド時に android/app/src/main/assets/ に
 * コピーする。
 *
 * 使い方: app.json の plugins に "./plugins/withAdiRegistration" を追加
 */
const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const ADI_TOKEN = "D7BOPYLP353BWAAAAAAAAAAAAA";

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const androidAssetsDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "assets"
      );
      if (!fs.existsSync(androidAssetsDir)) {
        fs.mkdirSync(androidAssetsDir, { recursive: true });
      }
      const target = path.join(androidAssetsDir, "adi-registration.properties");
      fs.writeFileSync(target, ADI_TOKEN, "utf8");
      console.log("[withAdiRegistration] wrote", target);
      return config;
    },
  ]);
};
