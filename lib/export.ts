/**
 * ユーザーデータのエクスポート（GDPR / 個人情報保護法対応）
 */
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useUser } from "./store";
import { useRelations } from "./relations";
import { useJournal } from "./journal";
import { errorMessage } from "./errors";

export async function exportUserData(): Promise<{ ok: boolean; path?: string; error?: string }> {
  try {
    const u = useUser.getState();
    const relList = useRelations.getState().list;
    const journal = useJournal.getState().entries;

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        nickname: u.nickname,
        // 未入力ユーザーの store にはデフォルト値が入っているため、実データと誤認させない
        birthDate: u.birthDateProvided
          ? `${u.birthYear}-${String(u.birthMonth).padStart(2, "0")}-${String(u.birthDay).padStart(2, "0")}`
          : null,
        birthPlace: u.birthDateProvided ? u.birthPlace : "",
        mbti: u.mbti,
        bloodType: u.bloodType,
        gender: u.gender,
        wakeUpTime: u.wakeUpTime,
        themes: u.themes,
        pillars: u.pillars,
      },
      relations: relList,
      journal: Object.values(journal),
    };

    // 個人データを含むため、永続の documentDirectory ではなく cacheDirectory に書き、
    // 共有後に必ず削除する（端末に平文の個人情報ファイルを残さない）
    const dir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory;
    const path = `${dir}asakizashi-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: "application/json" });
      }
    } finally {
      await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
    }
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}
