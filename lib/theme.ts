/**
 * 朝しるべ デザイントークン
 * asamei-brand.md v1.0 準拠
 */

export const C = {
  // 朝焼けグラデーション
  bgTop: "#1F2E4A",
  bgMid1: "#5B4274",
  bgMid2: "#C26E70",
  bgMid3: "#EBA47E",
  bgBottom: "#F5DDB5",

  // 朝メモカード
  paper: "#FAF4E0",
  paperDark: "#F0E2BE",
  paperBorder: "rgba(184,150,86,0.35)",
  red: "#9E2F2F",
  gold: "#A88340",
  ink: "#231A1F",
  inkSub: "#6B5C4E",
  inkMuted: "#A89685",

  // 状態
  good: "#5C8A6E",
  warn: "#7A5680",

  white: "#FFFFFF",
  white15: "rgba(255,255,255,0.15)",
  white12: "rgba(255,255,255,0.12)",
  white95: "rgba(255,255,255,0.95)",
  whiteBorder: "rgba(255,255,255,0.25)",
} as const;

export const dawnGradient = [
  C.bgTop, C.bgMid1, C.bgMid2, C.bgMid3, C.bgBottom,
] as const;

export const morningGradient = [
  "#F7E8CF",
  "#F2C69B",
  "#D98779",
  "#8C5870",
  "#2F3F60",
] as const;

export const F = {
  serif: "serif",
  sans: "sans-serif",
} as const;
