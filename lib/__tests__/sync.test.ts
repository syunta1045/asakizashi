/**
 * dbToProfile の復元ロジック回帰テスト
 *
 * 「pull で birthDateProvided が復元されず、機種変更で命式が消える」事故の防止。
 * birth_date は NOT NULL でスキップ時もダミー値が入るため、
 * 入力有無のサーバー側の事実は day_pillar（スキップ時は空文字）で判定する。
 */

// sync.ts はモジュール読み込み時に store / supabase / analytics / sentry へ依存するため mock する
jest.mock("../store", () => ({
  useUser: { getState: jest.fn() },
  registerProfileChangeHandler: jest.fn(),
}));
jest.mock("../supabase", () => ({
  supabase: null,
  isSupabaseConfigured: false,
  getSession: jest.fn(),
}));
jest.mock("../analytics", () => ({ setUserId: jest.fn() }));
jest.mock("../sentry", () => ({ setUser: jest.fn() }));

import { dbToProfile } from "../sync";
import type { DbUser } from "../supabase";

function dbUser(overrides: Partial<DbUser> = {}): DbUser {
  return {
    id: "u1",
    auth_id: "a1",
    nickname: "はな",
    birth_date: "1998-07-12",
    birth_place: "",
    mbti: null,
    blood_type: null,
    gender: null,
    wake_up_time: "06:30:00",
    themes: [],
    year_pillar: "",
    month_pillar: "",
    day_pillar: "",
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

describe("dbToProfile", () => {
  test("day_pillar が空 = 生年月日スキップユーザー → birthDateProvided は false", () => {
    const p = dbToProfile(dbUser({ day_pillar: "" }));
    expect(p.birthDateProvided).toBe(false);
  });

  test("day_pillar あり = 入力済みユーザー → birthDateProvided は true", () => {
    const p = dbToProfile(dbUser({ day_pillar: "戊午", birth_date: "1990-03-05" }));
    expect(p.birthDateProvided).toBe(true);
    expect(p.birthYear).toBe(1990);
    expect(p.birthMonth).toBe(3);
    expect(p.birthDay).toBe(5);
  });

  test("wake_up_time は HH:MM に丸めて復元", () => {
    const p = dbToProfile(dbUser({ wake_up_time: "06:30:00" }));
    expect(p.wakeUpTime).toBe("06:30");
  });
});
