import {
  buildMorningReflection,
  buildRelationNudge,
  buildWeeklyNudge,
  localDateKey,
  pickDailyRelation,
  previousDateKey,
} from "../dailyEngagement";
import type { JournalEntry } from "../journal";
import type { Relation } from "../relations";

const sampleRelation = (id: string, name: string, createdAt: number): Relation => ({
  id,
  name,
  createdAt,
  genre: "person",
  label: "友人",
  birthYear: 1998,
  birthMonth: 7,
  birthDay: 12,
  pillars: {
    year: { stem: "戊", branch: "寅" },
    month: { stem: "己", branch: "未" },
    day: { stem: "庚", branch: "申" },
  },
});

describe("dailyEngagement", () => {
  test("localDateKey and previousDateKey use local calendar date", () => {
    const d = new Date(2026, 4, 24, 8, 30);
    expect(localDateKey(d)).toBe("2026-05-24");
    expect(previousDateKey(d)).toBe("2026-05-23");
  });

  test("buildMorningReflection returns a gentle prompt from yesterday note", () => {
    const entry: JournalEntry = {
      date: "2026-05-23",
      mood: 2,
      note: "少し疲れたけど、夕方に散歩したら落ち着いた",
    };
    const reflection = buildMorningReflection(entry);
    expect(reflection?.title).toContain("もやもや");
    expect(reflection?.body).toContain("昨日は「少し疲れたけど、夕方に散歩したら落ち着いた」");
    expect(reflection?.action).toContain("余白");
  });

  test("pickDailyRelation is deterministic for the same day", () => {
    const relations = [
      sampleRelation("b", "Bさん", 20),
      sampleRelation("a", "Aさん", 10),
      sampleRelation("c", "Cさん", 30),
    ];
    expect(pickDailyRelation(relations, "2026-05-24")).toEqual(pickDailyRelation(relations, "2026-05-24"));
  });

  test("pickDailyRelation returns null when no relation exists", () => {
    expect(pickDailyRelation([], "2026-05-24")).toBeNull();
  });

  test("buildRelationNudge avoids deciding the other person's feelings", () => {
    const nudge = buildRelationNudge(
      sampleRelation("a", "Aさん", 10),
      { kind: "warn", reason: "冲の関係。要件は短く、距離を保つと吉" },
      11
    );
    expect(nudge.title).toContain("Aさん");
    expect(nudge.title).not.toContain("さんさん");
    expect(nudge.body).toContain("急がせない");
    expect(nudge.body).not.toContain("相手は");
    expect(nudge.suggestedLine.length).toBeGreaterThan(0);
  });

  test("buildRelationNudge does not duplicate common honorifics", () => {
    const nudge = buildRelationNudge(
      sampleRelation("teacher", "山田先生", 10),
      { kind: "good", reason: "同じ気が巡る日" },
      2
    );
    expect(nudge.title).toContain("山田先生");
    expect(nudge.title).not.toContain("先生さん");
  });

  test("buildWeeklyNudge shows progress before 7 days and report after 7 days", () => {
    const today = new Date(2026, 4, 24, 8, 0);
    expect(buildWeeklyNudge(3, {}, today)).toMatchObject({ label: "3/7", progress: 3 });

    const entries: Record<string, JournalEntry> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      entries[localDateKey(d)] = { date: localDateKey(d), mood: 1, note: "" };
    }
    const weekly = buildWeeklyNudge(7, entries, today);
    expect(weekly.label).toBe("7/7");
    expect(weekly.title).toContain("今週");
  });
});
