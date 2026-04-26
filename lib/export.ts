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
        birthDate: `${u.birthYear}-${String(u.birthMonth).padStart(2, "0")}-${String(u.birthDay).padStart(2, "0")}`,
        birthPlace: u.birthPlace,
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

    const path = `${(FileSystem as any).documentDirectory}asakizashi-export-${Date.now()}.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2));

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: "application/json" });
    }
    return { ok: true, path };
  } catch (e: unknown) {
    return { ok: false, error: errorMessage(e) };
  }
}
