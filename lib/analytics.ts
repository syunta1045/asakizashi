/**
 * アナリティクス共通インターフェース
 *
 * MVP: console.log のみ（オフライン対応）
 * 本番: PostHog 連携（lib/posthog.ts 経由）
 */
import { capture as phCapture, identify as phIdentify } from "./posthog";

export type EventName =
  | "app_opened"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "today_viewed"
  | "ranking_viewed"
  | "relations_viewed"
  | "relation_added"
  | "journal_entry_saved"
  | "premium_viewed"
  | "trial_started"
  | "settings_changed"
  | "share_clicked"
  | "sign_in_attempted"
  | "sign_in_succeeded"
  | "sign_out"
  | "revenuecat_init_failed"
  | "notifications_rescheduled"
  | "account_deleted";

type Props = Record<string, string | number | boolean | null>;

let userId: string | null = null;

export function setUserId(id: string | null) {
  userId = id;
  if (id) phIdentify(id);
}

export function track(event: EventName, properties: Props = {}) {
  phCapture(event, { ...properties, userId });
  if (__DEV__) {
    console.log(`[analytics] ${event}`, { ...properties, userId });
  }
}

export function screen(name: string, properties: Props = {}) {
  if (__DEV__) {
    console.log(`[screen] ${name}`, properties);
  }
}
