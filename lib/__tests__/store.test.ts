/**
 * 生年月日 optional 化（birthDateProvided）と computePillars の回帰テスト
 *
 * 「オンボでスキップ→後から入力しても命式が有効化されない」事故の防止。
 * /edit/birth（BirthEditor）は値の選択時に birthDateProvided を true にする前提。
 */
// zustand persist の書き込みが native モジュールに触れて worker が落ちるため公式 mock を使う
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { useUser, registerProfileChangeHandler, withRemoteApply } from "../store";

describe("birthDateProvided と computePillars", () => {
  beforeEach(() => {
    useUser.getState().reset();
  });

  test("未入力（フラグ false）のうちは computePillars しても pillars は null", () => {
    const u = useUser.getState();
    u.setField("birthYear", 1990);
    u.setField("birthMonth", 3);
    u.setField("birthDay", 5);
    u.computePillars();
    expect(useUser.getState().pillars).toBeNull();
    expect(useUser.getState().dayPillarStr).toBe("");
  });

  test("後から入力してフラグを立てると pillars が計算される（後入力経路の解放）", () => {
    const u = useUser.getState();
    u.setField("birthDateProvided", true);
    u.setField("birthYear", 1990);
    u.setField("birthMonth", 3);
    u.setField("birthDay", 5);
    u.computePillars();
    expect(useUser.getState().pillars).not.toBeNull();
    expect(useUser.getState().dayPillarStr).not.toBe("");
  });
});

describe("withRemoteApply（pull 往復の抑止）", () => {
  test("サーバー適用中の setField は push を発火せず、通常の setField は発火する", () => {
    jest.useFakeTimers();
    const store = useUser.getState();
    store.reset();
    store.finishOnboarding(); // isOnboarded = true（push 発火の前提）
    let pushCount = 0;
    registerProfileChangeHandler(async () => { pushCount++; });

    // pull 適用中は 800ms 経っても push しない
    withRemoteApply(() => { store.setField("nickname", "サーバー値"); });
    jest.advanceTimersByTime(1000);
    expect(pushCount).toBe(0);

    // ユーザーの手入力はデバウンス後に 1 回 push する
    store.setField("nickname", "手入力");
    jest.advanceTimersByTime(1000);
    expect(pushCount).toBe(1);

    jest.useRealTimers();
  });
});
