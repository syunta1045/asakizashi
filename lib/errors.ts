/**
 * 共通エラーユーティリティ
 * - catch (e: unknown) でも安全にメッセージ/コードを取り出す
 */

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  try {
    return String(e);
  } catch {
    return "unknown error";
  }
}

export function errorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string") {
    return (e as { code: string }).code;
  }
  return undefined;
}

export function userCancelled(e: unknown): boolean {
  const c = errorCode(e);
  if (c === "ERR_CANCELED" || c === "ERR_REQUEST_CANCELED") return true;
  if (e && typeof e === "object" && "userCancelled" in e && (e as { userCancelled: unknown }).userCancelled) return true;
  return false;
}
