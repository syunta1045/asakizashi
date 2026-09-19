/**
 * アプリ内レビュー依頼（App Store / Google Play のネイティブ評価プロンプト）。
 *
 * 方針:
 * - ポジティブな瞬間（連続記録の節目を祝ったあと等）にだけ呼ぶ。
 * - このアプリ版につき最大1回。OS 側の頻度制限（Apple: 365日で3回まで等）も別途効く。
 * - レビュー機能が使えない環境（シミュレータ / 未サインイン端末 / 非対応）では静かに何もしない。
 * - 何が起きても体験を止めない（全 try/catch）。
 */
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { track } from "./analytics";

const ASKED_VERSION_KEY = "asakizashi-review-asked-version";

export async function maybeRequestReview(): Promise<void> {
  try {
    const version = Constants.expoConfig?.version ?? "unknown";

    // この版で既に依頼済みなら何もしない
    const asked = await AsyncStorage.getItem(ASKED_VERSION_KEY);
    if (asked === version) return;

    // 端末がレビュー依頼に対応しているか
    const canReview = await StoreReview.hasAction();
    if (!canReview) return;

    // 依頼は一度きり。requestReview が失敗しても再依頼しないよう、先に記録する。
    await AsyncStorage.setItem(ASKED_VERSION_KEY, version);
    track("review_prompt_shown", { version });
    await StoreReview.requestReview();
  } catch {
    // no-op: レビュー依頼は付加的機能。失敗は無視する。
  }
}
