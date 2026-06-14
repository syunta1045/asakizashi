/**
 * subscription のトライアル期限ロジック
 * Date.now() を mock してテストする
 */
const storage: Record<string, string> = {};

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(storage[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
    return Promise.resolve();
  }),
}));

import { isTrialActive, trialDaysRemaining, useSubscription } from "../subscription";

const FIXED_NOW = 1_700_000_000_000; // 任意の固定時刻
const DAY = 24 * 60 * 60 * 1000;

describe("isTrialActive", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
  });
  afterEach(() => jest.restoreAllMocks());

  test("plan が trial 以外なら false", () => {
    expect(isTrialActive({ plan: "free", isPremium: false, trialStartedAt: FIXED_NOW } as any)).toBe(false);
    expect(isTrialActive({ plan: "premium_monthly", isPremium: true, trialStartedAt: null } as any)).toBe(false);
  });

  test("trialStartedAt が null なら false", () => {
    expect(isTrialActive({ plan: "trial", isPremium: true, trialStartedAt: null } as any)).toBe(false);
  });

  test("開始から 1 日後はアクティブ", () => {
    expect(isTrialActive({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - 1 * DAY,
    } as any)).toBe(true);
  });

  test("開始から 6 日後でもアクティブ", () => {
    expect(isTrialActive({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - 6 * DAY,
    } as any)).toBe(true);
  });

  test("開始から 7 日と 1ms 後は失効", () => {
    expect(isTrialActive({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - (7 * DAY + 1),
    } as any)).toBe(false);
  });

  test("端末時計が逆行（trialStartedAt が未来）した場合はアクティブ扱い", () => {
    expect(isTrialActive({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW + 1000,
    } as any)).toBe(true);
  });
});

describe("trialDaysRemaining", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
  });
  afterEach(() => jest.restoreAllMocks());

  test("失効済みは 0", () => {
    expect(trialDaysRemaining({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - 10 * DAY,
    } as any)).toBe(0);
  });

  test("開始直後は 7", () => {
    expect(trialDaysRemaining({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW,
    } as any)).toBe(7);
  });

  test("3 日経過時は 4", () => {
    expect(trialDaysRemaining({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - 3 * DAY,
    } as any)).toBe(4);
  });

  test("6 日 23 時間後は 1（その日いっぱいは有効）", () => {
    expect(trialDaysRemaining({
      plan: "trial", isPremium: true,
      trialStartedAt: FIXED_NOW - (6 * DAY + 23 * 60 * 60 * 1000),
    } as any)).toBe(1);
  });

  test("plan が trial 以外なら 0", () => {
    expect(trialDaysRemaining({
      plan: "premium_yearly", isPremium: true,
      trialStartedAt: FIXED_NOW,
    } as any)).toBe(0);
  });
});

describe("applyEntitlement", () => {
  beforeEach(() => {
    useSubscription.setState({ plan: "free", isPremium: false, trialStartedAt: null });
  });

  test("uses RevenueCat plan when provided", () => {
    useSubscription.getState().applyEntitlement(true, "premium_yearly");
    expect(useSubscription.getState()).toMatchObject({
      plan: "premium_yearly",
      isPremium: true,
      trialStartedAt: null,
    });
  });

  test("preserves existing premium plan when active plan is unknown", () => {
    useSubscription.setState({ plan: "premium_yearly", isPremium: true, trialStartedAt: null });
    useSubscription.getState().applyEntitlement(true);
    expect(useSubscription.getState().plan).toBe("premium_yearly");
  });

  test("clears trial state when store entitlement is active", () => {
    useSubscription.setState({ plan: "trial", isPremium: true, trialStartedAt: FIXED_NOW });
    useSubscription.getState().applyEntitlement(true, "premium_monthly");
    expect(useSubscription.getState()).toMatchObject({
      plan: "premium_monthly",
      isPremium: true,
      trialStartedAt: null,
    });
  });
});
