import type { CompatKind } from "./compatibility";
import type { JournalEntry } from "./journal";
import type { Relation } from "./relations";

export type MorningReflection = {
  title: string;
  body: string;
  action: string;
};

export type RelationNudge = {
  title: string;
  body: string;
  suggestedLine: string;
};

export type WeeklyNudge = {
  label: string;
  title: string;
  body: string;
  progress: number;
};

const MOOD_TONE: Record<JournalEntry["mood"], { title: string; body: string; action: string }> = {
  0: {
    title: "昨日のよい感覚を、少しだけ続ける朝",
    body: "昨日は軽やかな記録が残っています。今日は勢いを広げすぎず、よかった感覚を一つだけ再現すると整います。",
    action: "昨日うまくいったことを、朝のうちに一つだけ思い出す",
  },
  1: {
    title: "ふつうの日を、静かに積み重ねる朝",
    body: "昨日は大きく揺れずに過ごせた記録です。今日は小さな予定を一つ先に片付けると、気持ちが安定します。",
    action: "午前中に小さな用事を一つ終える",
  },
  2: {
    title: "もやもやを、急がずほどく朝",
    body: "昨日のもやもやは、今日の整えどころを教えてくれています。無理に結論を出さず、言葉にする前に一呼吸置くとよさそうです。",
    action: "予定を一つ軽くして、余白を作る",
  },
  3: {
    title: "自分にやさしく戻る朝",
    body: "昨日は少し重たい記録が残っています。今日は広げるより守る日。できたことを小さく数えるだけで十分です。",
    action: "温かい飲み物を用意して、最初の十分をゆっくり始める",
  },
};

export function localDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function previousDateKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

export function buildMorningReflection(entry?: JournalEntry): MorningReflection | null {
  if (!entry) return null;
  const tone = MOOD_TONE[entry.mood];
  const note = clipNote(entry.note.trim());
  return {
    title: tone.title,
    body: note ? `昨日は「${note}」と残していました。${tone.body}` : tone.body,
    action: tone.action,
  };
}

export function pickDailyRelation(relations: Relation[], dateKey: string = localDateKey()): Relation | null {
  if (relations.length === 0) return null;
  const ordered = [...relations].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return ordered[hashString(dateKey) % ordered.length] ?? null;
}

export function buildRelationNudge(
  relation: Relation,
  compat: { kind: CompatKind; reason: string },
  pacePosition?: number
): RelationNudge {
  const name = nameWithHonorific(relation.name);
  const paceLine = pacePosition && pacePosition <= 3
    ? `${name}には、今日は声をかけやすいタイミングです。`
    : pacePosition && pacePosition >= 10
      ? `${name}には、急がせない言葉が合いそうです。`
      : "いつもより少し丁寧な間合いが合いそうです。";
  const tone = relationTone(relation, compat.kind);
  return {
    title: `今日は ${name} への一言を整える`,
    body: `${tone.body} ${paceLine}`,
    suggestedLine: tone.line,
  };
}

export function buildWeeklyNudge(streak: number, entries: Record<string, JournalEntry>, today: Date = new Date()): WeeklyNudge {
  const recent = recentEntries(entries, 7, today);
  const progress = Math.min(7, Math.max(streak, recent.length));
  if (progress < 7) {
    const remain = 7 - progress;
    return {
      label: `${progress}/7`,
      title: `あと${remain}日で、週の調子が見えてきます`,
      body: "朝メモと夜の振り返りを続けるほど、あなたの調子の波が少しずつ見えるようになります。",
      progress,
    };
  }

  const avg = recent.reduce((sum, e) => sum + e.mood, 0) / Math.max(1, recent.length);
  const title = avg < 0.8
    ? "今週は、よい調子を保てています"
    : avg < 1.6
      ? "今週は、安定した歩幅で進めています"
      : avg < 2.4
        ? "今週は、少し整える時間が鍵です"
        : "今週は、守る日を増やしてよさそうです";
  const body = avg < 1.6
    ? "調子がよい日ほど予定を詰めすぎず、余白を残すと来週も続けやすくなります。"
    : "重たい日は悪いサインではなく、整える場所を教えてくれる記録です。来週は朝の最初の予定を軽くしてみて。";

  return {
    label: "7/7",
    title,
    body,
    progress: 7,
  };
}

function relationTone(relation: Relation, kind: CompatKind): { body: string; line: string } {
  if (relation.genre === "work") {
    return {
      body: kind === "warn"
        ? "仕事の話は、結論と確認事項を短く分けると伝わりやすい日です。"
        : "仕事の話は、先に感謝を添えるとやり取りがなめらかになります。",
      line: "確認ありがとうございます。落ち着いて進めます。",
    };
  }
  if (relation.genre === "oshi") {
    return {
      body: "応援の気持ちは、明るく短い言葉にすると自分の朝も整います。",
      line: "今日も応援しています。無理せず進めますように。",
    };
  }
  if (relation.genre === "pet") {
    return {
      body: "近くにいる存在へ、いつもより少しゆっくり触れる時間が合いそうです。",
      line: "今日も一緒に、ゆっくり過ごそうね。",
    };
  }
  if (relation.genre === "key_day") {
    return {
      body: "大切な日を思い出すことで、今日の選び方が少し落ち着きます。",
      line: "あの日のことを思い出して、今日を少し丁寧に過ごします。",
    };
  }
  return {
    body: kind === "warn"
      ? "急いで踏み込むより、短くやわらかい言葉が合いそうです。"
      : "近い人には、用件より先にひとこと気遣いを置くと会話がやわらぎます。",
    line: "今日も無理せずいこうね。落ち着いたらまた話そう。",
  };
}

function recentEntries(entries: Record<string, JournalEntry>, days: number, today: Date): JournalEntry[] {
  const out: JournalEntry[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const entry = entries[localDateKey(d)];
    if (entry) out.push(entry);
  }
  return out;
}

function clipNote(note: string): string {
  if (note.length <= 24) return note;
  return `${note.slice(0, 24)}…`;
}

function nameWithHonorific(name: string): string {
  return /(さん|ちゃん|くん|君|様|さま|先生|氏)$/.test(name) ? name : `${name}さん`;
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
