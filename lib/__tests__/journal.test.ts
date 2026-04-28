import { pruneOldEntries, JOURNAL_RETENTION_DAYS, type JournalEntry } from "../journal";

function entry(date: string, mood: 0 | 1 | 2 | 3 = 0): JournalEntry {
  return { date, mood, note: "" };
}

describe("pruneOldEntries", () => {
  test("保持期間内のエントリは残す", () => {
    const now = new Date("2026-04-28T00:00:00");
    const entries = {
      "2026-04-28": entry("2026-04-28"),
      "2026-04-01": entry("2026-04-01"),
      "2026-01-01": entry("2026-01-01"),
    };
    const out = pruneOldEntries(entries, 30, now);
    expect(out["2026-04-28"]).toBeDefined();
    expect(out["2026-04-01"]).toBeDefined();
    expect(out["2026-01-01"]).toBeUndefined();
  });

  test("空辞書は空のまま", () => {
    expect(pruneOldEntries({}, 30, new Date("2026-04-28"))).toEqual({});
  });

  test("カットオフ日のエントリは保持される", () => {
    const now = new Date("2026-04-28T00:00:00");
    // 30日前 = 2026-03-29
    const out = pruneOldEntries({ "2026-03-29": entry("2026-03-29") }, 30, now);
    expect(out["2026-03-29"]).toBeDefined();
  });

  test("カットオフ日より1日古いエントリは削除", () => {
    const now = new Date("2026-04-28T00:00:00");
    const out = pruneOldEntries({ "2026-03-28": entry("2026-03-28") }, 30, now);
    expect(out["2026-03-28"]).toBeUndefined();
  });

  test("デフォルトの保持期間は2年", () => {
    expect(JOURNAL_RETENTION_DAYS).toBe(730);
    const now = new Date("2026-04-28T00:00:00");
    // 2年前のエントリは残る、3年前は消える
    const out = pruneOldEntries({
      "2024-05-01": entry("2024-05-01"),
      "2023-01-01": entry("2023-01-01"),
    }, JOURNAL_RETENTION_DAYS, now);
    expect(out["2024-05-01"]).toBeDefined();
    expect(out["2023-01-01"]).toBeUndefined();
  });
});
