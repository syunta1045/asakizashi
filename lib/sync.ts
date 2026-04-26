/**
 * ローカル状態 (Zustand) と Supabase の同期
 *
 * 設計原則:
 * - ローカルが Source of Truth（オフラインファースト）
 * - サインイン時: ローカルがあれば push、なければ pull
 * - フィールド更新: ローカル即時更新 → 非同期で Supabase へ反映
 */
import { useUser, registerProfileChangeHandler, type UserProfile } from "./store";
import { supabase, isSupabaseConfigured, type DbUser, getSession } from "./supabase";
import { pillarToString } from "./bazi";
import { setUserId } from "./analytics";
import { setUser as setSentryUser } from "./sentry";

// 起動時に store からの変更通知を購読
registerProfileChangeHandler(async () => {
  await pushUserToServer();
});

function profileToDb(p: UserProfile, authId: string, pillarsStr: { y: string; m: string; d: string }): Partial<DbUser> {
  const isoBirth = `${p.birthYear}-${String(p.birthMonth).padStart(2, "0")}-${String(p.birthDay).padStart(2, "0")}`;
  return {
    auth_id: authId,
    nickname: p.nickname,
    birth_date: isoBirth,
    birth_place: p.birthPlace,
    mbti: p.mbti,
    blood_type: p.bloodType,
    gender: p.gender,
    wake_up_time: p.wakeUpTime,
    themes: p.themes,
    year_pillar: pillarsStr.y,
    month_pillar: pillarsStr.m,
    day_pillar: pillarsStr.d,
  };
}

function dbToProfile(u: DbUser): Partial<UserProfile> {
  const [y, m, d] = u.birth_date.split("-").map(Number);
  return {
    nickname: u.nickname,
    birthYear: y,
    birthMonth: m,
    birthDay: d,
    birthPlace: u.birth_place,
    mbti: u.mbti,
    bloodType: u.blood_type as UserProfile["bloodType"],
    gender: u.gender as UserProfile["gender"],
    wakeUpTime: u.wake_up_time.slice(0, 5),
    themes: u.themes,
  };
}

/**
 * ローカル → Supabase 同期（push）
 */
export async function pushUserToServer(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: "Supabase未設定" };
  const session = await getSession();
  if (!session) return { ok: false, error: "未ログイン" };

  const u = useUser.getState();
  if (!u.pillars) return { ok: false, error: "命式未算出" };

  const pillarsStr = {
    y: pillarToString(u.pillars.year),
    m: pillarToString(u.pillars.month),
    d: pillarToString(u.pillars.day),
  };
  const payload = profileToDb(u, session.user.id, pillarsStr);
  const { error } = await supabase.from("users").upsert(payload, { onConflict: "auth_id" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Supabase → ローカル 同期（pull）
 */
export async function pullUserFromServer(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: "Supabase未設定" };
  const session = await getSession();
  if (!session) return { ok: false, error: "未ログイン" };

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", session.user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "サーバーに未登録" };

  const profile = dbToProfile(data as DbUser);
  const store = useUser.getState();
  // フィールド毎に明示的に setField（型安全 + 不正フィールド黙殺の防止）
  if (profile.nickname !== undefined) store.setField("nickname", profile.nickname);
  if (profile.birthYear !== undefined) store.setField("birthYear", profile.birthYear);
  if (profile.birthMonth !== undefined) store.setField("birthMonth", profile.birthMonth);
  if (profile.birthDay !== undefined) store.setField("birthDay", profile.birthDay);
  if (profile.birthPlace !== undefined) store.setField("birthPlace", profile.birthPlace);
  if (profile.mbti !== undefined) store.setField("mbti", profile.mbti);
  if (profile.bloodType !== undefined) store.setField("bloodType", profile.bloodType);
  if (profile.gender !== undefined) store.setField("gender", profile.gender);
  if (profile.wakeUpTime !== undefined) store.setField("wakeUpTime", profile.wakeUpTime);
  if (profile.themes !== undefined) store.setField("themes", profile.themes);
  store.computePillars();
  store.finishOnboarding();
  return { ok: true };
}

export type SyncResult = {
  ok: boolean;
  /** "push" / "pull" / "none" — どの方向の同期を試みたか */
  direction: "push" | "pull" | "none";
  /** pull で既存ユーザーが見つかったか（呼び出し側が遷移先を判断するのに使う） */
  hasServerProfile: boolean;
  error?: string;
};

/**
 * サインイン直後の同期処理
 * ローカルにオンボード済みデータがあればサーバーへ push、なければ pull。
 * 戻り値で結果を返すので、呼び出し側はオンボへ飛ばす前に必ず判定すること。
 */
export async function syncOnSignIn(): Promise<SyncResult> {
  const u = useUser.getState();
  if (u.isOnboarded && u.pillars) {
    const r = await pushUserToServer();
    return { ok: r.ok, direction: "push", hasServerProfile: u.isOnboarded, error: r.error };
  }
  const r = await pullUserFromServer();
  // pull 成功 = サーバーに既存プロフィールあり（pullUserFromServer が finishOnboarding まで実行済）
  // pull 失敗の理由が "サーバーに未登録" なら新規ユーザーなのでオンボへ進めて OK
  const isNewUser = !r.ok && r.error === "サーバーに未登録";
  return {
    ok: r.ok || isNewUser,
    direction: "pull",
    hasServerProfile: r.ok,
    error: isNewUser ? undefined : r.error,
  };
}

/**
 * 起動時のセッション復元 → 自動 pull
 */
export async function restoreSession(): Promise<{ signedIn: boolean }> {
  if (!isSupabaseConfigured) return { signedIn: false };
  const session = await getSession();
  if (!session) return { signedIn: false };
  // ユーザーIDを analytics / sentry に紐付け
  setUserId(session.user.id);
  setSentryUser(session.user.id);
  // サーバーから最新を pull
  await pullUserFromServer();
  return { signedIn: true };
}
