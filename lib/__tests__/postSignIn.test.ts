/**
 * 共通サインイン後処理 / サインアウトクリーンアップの回帰テスト
 *
 * 「Apple だけ ensureRevenueCatConfigured を呼び忘れる」のような事故を
 * テストレベルで検出できるようにする。
 */

// === モジュール mock ===
const syncOnSignInMock = jest.fn();
const ensureRCMock = jest.fn();
const resetRCMock = jest.fn();
const supabaseSignOutMock = jest.fn();
const trackMock = jest.fn();

jest.mock("../sync", () => ({
  syncOnSignIn: (...a: unknown[]) => syncOnSignInMock(...a),
}));
jest.mock("../revenuecat", () => ({
  ensureRevenueCatConfigured: (...a: unknown[]) => ensureRCMock(...a),
  resetRevenueCat: (...a: unknown[]) => resetRCMock(...a),
}));
jest.mock("../supabase", () => ({
  signOut: (...a: unknown[]) => supabaseSignOutMock(...a),
}));
jest.mock("../analytics", () => ({
  track: (...a: unknown[]) => trackMock(...a),
}));
jest.mock("../store", () => ({
  useUser: { getState: () => ({ isOnboarded: true }) },
}));
jest.mock("../errors", () => ({
  errorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

// 動的 import で mock を確実に適用
let finishSignIn: typeof import("../postSignIn").finishSignIn;
let performSignOutCleanup: typeof import("../postSignIn").performSignOutCleanup;

beforeAll(async () => {
  ({ finishSignIn, performSignOutCleanup } = await import("../postSignIn"));
});

beforeEach(() => {
  syncOnSignInMock.mockReset();
  ensureRCMock.mockReset();
  resetRCMock.mockReset();
  supabaseSignOutMock.mockReset();
  trackMock.mockReset();
});

describe("finishSignIn", () => {
  test("同期成功 → ensureRevenueCatConfigured が必ず呼ばれる", async () => {
    syncOnSignInMock.mockResolvedValue({ ok: true });
    ensureRCMock.mockResolvedValue({ ok: true });

    const r = await finishSignIn();

    expect(syncOnSignInMock).toHaveBeenCalledTimes(1);
    expect(ensureRCMock).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);
    expect(r.route).toBe("/today");
  });

  test("同期失敗時は ensureRevenueCatConfigured を呼ばず、ok:false で戻る", async () => {
    syncOnSignInMock.mockResolvedValue({ ok: false, error: "通信エラー" });

    const r = await finishSignIn();

    expect(syncOnSignInMock).toHaveBeenCalledTimes(1);
    expect(ensureRCMock).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
    expect(r.error).toBe("通信エラー");
  });

  test("RC 失敗（未設定/未ログイン以外）は warn + analytics に残る", async () => {
    syncOnSignInMock.mockResolvedValue({ ok: true });
    ensureRCMock.mockResolvedValue({ ok: false, error: "API キー無効" });
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const r = await finishSignIn();

    expect(r.ok).toBe(true); // RC 失敗してもサインインは成立
    expect(trackMock).toHaveBeenCalledWith("revenuecat_init_failed", expect.objectContaining({ reason: "API キー無効" }));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test("RC 失敗が「未設定」「未ログイン」なら静かに無視（analytics 飛ばさない）", async () => {
    syncOnSignInMock.mockResolvedValue({ ok: true });
    ensureRCMock.mockResolvedValue({ ok: false, error: "未設定" });

    await finishSignIn();

    expect(trackMock).not.toHaveBeenCalled();
  });

  test("RC が throw しても finishSignIn は ok:true で戻る", async () => {
    syncOnSignInMock.mockResolvedValue({ ok: true });
    ensureRCMock.mockRejectedValue(new Error("ネットワーク断"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const r = await finishSignIn();

    expect(r.ok).toBe(true);
    expect(trackMock).toHaveBeenCalledWith("revenuecat_init_failed", expect.objectContaining({ reason: "ネットワーク断" }));
    warn.mockRestore();
  });
});

describe("performSignOutCleanup", () => {
  test("supabase.signOut と resetRevenueCat の両方が呼ばれる", async () => {
    supabaseSignOutMock.mockResolvedValue(undefined);
    resetRCMock.mockResolvedValue(undefined);

    await performSignOutCleanup();

    expect(supabaseSignOutMock).toHaveBeenCalledTimes(1);
    expect(resetRCMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_out");
  });

  test("supabase.signOut が throw しても resetRevenueCat は実行される", async () => {
    supabaseSignOutMock.mockRejectedValue(new Error("server down"));
    resetRCMock.mockResolvedValue(undefined);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await performSignOutCleanup();

    expect(resetRCMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("sign_out");
    warn.mockRestore();
  });

  test("resetRevenueCat が throw してもクラッシュしない", async () => {
    supabaseSignOutMock.mockResolvedValue(undefined);
    resetRCMock.mockRejectedValue(new Error("rc broken"));
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(performSignOutCleanup()).resolves.not.toThrow();
    expect(trackMock).toHaveBeenCalledWith("sign_out");
    warn.mockRestore();
  });
});
