/**
 * 国際化（i18n）スキャフォールド
 *
 * Phase 2 で多言語展開する際の準備。
 * MVPでは ja のみ使用。
 */

export type Locale = "ja" | "en";

export const STRINGS = {
  ja: {
    appName: "朝しるべ",
    appNameRoman: "",
    tagline: "今日を整える朝メモ",
    welcome: "毎朝、今日を整える朝メモをお届けします",
    // 共通アクション
    start: "はじめる",
    next: "次へ",
    back: "戻る",
    close: "閉じる",
    done: "完了",
    cancel: "キャンセル",
    save: "保存",
    delete: "削除",
    confirm: "確認",
    retry: "もう一度",
    // タブ
    today: "今日",
    pace: "ペース",
    relations: "つながり",
    journal: "振り返り",
    profile: "あなた",
    settings: "設定",
    premium: "プレミアム",
    tendencyMemo: "傾向メモ",
    monthlyCalendar: "月間カレンダー",
    // 今日の構成
    youSan: (name: string) => `${name || "あなた"}さん、おはよう`,
    morningMemo: "朝メモ",
    todayPace: "今日のペース",
    todayIntention: "今日の心がけ",
    careHints: "整えるヒント",
    todoLabel: "やってみること",
    avoidLabel: "今日は控えたいこと",
    intentTitle: "今日の行動メモ",
    // a11y
    a11y: {
      back: "戻る",
      close: "閉じる",
      open: "開く",
      menu: "メニュー",
      add: "追加",
      remove: "削除",
      shareOpen: "シェアメニューを開く",
      shareClose: "シェアメニューを閉じる",
      moodSelect: (label: string) => `気分: ${label}`,
      decrement: (field: string) => `${field}を1減らす`,
      increment: (field: string) => `${field}を1増やす`,
    },
  },
  en: {
    appName: "朝しるべ",
    appNameRoman: "",
    tagline: "A line to steady your morning",
    welcome: "A daily verse for your morning",
    start: "Begin",
    next: "Next",
    back: "Back",
    close: "Close",
    done: "Done",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    confirm: "Confirm",
    retry: "Try again",
    today: "Today",
    pace: "Pace",
    relations: "Bonds",
    journal: "Reflect",
    profile: "You",
    settings: "Settings",
    premium: "Premium",
    tendencyMemo: "Tendency memo",
    monthlyCalendar: "Monthly calendar",
    youSan: (name: string) => `Good morning, ${name || "friend"}`,
    morningMemo: "Morning memo",
    todayPace: "Today's pace",
    todayIntention: "Today's intention",
    careHints: "Small care hints",
    todoLabel: "Lean into",
    avoidLabel: "Hold back from",
    intentTitle: "Today's guidance",
    a11y: {
      back: "Back",
      close: "Close",
      open: "Open",
      menu: "Menu",
      add: "Add",
      remove: "Delete",
      shareOpen: "Open share menu",
      shareClose: "Close share menu",
      moodSelect: (label: string) => `Mood: ${label}`,
      decrement: (field: string) => `Decrease ${field} by 1`,
      increment: (field: string) => `Increase ${field} by 1`,
    },
  },
} as const;

let currentLocale: Locale = "ja";
export function setLocale(l: Locale) { currentLocale = l; }
export function t<K extends keyof typeof STRINGS["ja"]>(key: K): typeof STRINGS["ja"][K] {
  return STRINGS[currentLocale][key] as typeof STRINGS["ja"][K];
}
