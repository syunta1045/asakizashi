/**
 * PostHog 統合プレースホルダ
 *
 * 本格導入時:
 *   npm install posthog-react-native posthog-react-native-session-replay
 *   import PostHog from "posthog-react-native";
 *   const posthog = new PostHog(API_KEY, { host: HOST });
 */
const API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
// const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

export const isPostHogConfigured = Boolean(API_KEY);

export function capture(event: string, properties: Record<string, unknown> = {}) {
  if (__DEV__) {
    console.log(`[posthog stub] ${event}`, properties);
    return;
  }
  // TODO: posthog.capture(event, properties);
}

export function identify(userId: string, traits: Record<string, unknown> = {}) {
  if (__DEV__) {
    console.log(`[posthog stub] identify ${userId}`, traits);
    return;
  }
  // TODO: posthog.identify(userId, traits);
}

export function reset() {
  if (__DEV__) console.log("[posthog stub] reset");
  // TODO: posthog.reset();
}
