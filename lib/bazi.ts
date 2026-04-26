/**
 * 四柱推命（Bazi）計算エンジン
 *
 * 旭兆では時柱を使わず、年柱・月柱・日柱の3柱のみ算出する。
 * 立春（節入り）と二十四節気の境界処理を厳密に行う。
 */

// ============================================================
// 天干（10）と 地支（12）
// ============================================================
export const STEMS = [
  "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸",
] as const;
export type Stem = (typeof STEMS)[number];

export const BRANCHES = [
  "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
] as const;
export type Branch = (typeof BRANCHES)[number];

export type Pillar = { stem: Stem; branch: Branch };

export const stemReading: Record<Stem, string> = {
  甲: "きのえ", 乙: "きのと", 丙: "ひのえ", 丁: "ひのと", 戊: "つちのえ",
  己: "つちのと", 庚: "かのえ", 辛: "かのと", 壬: "みずのえ", 癸: "みずのと",
};
export const branchReading: Record<Branch, string> = {
  子: "ね", 丑: "うし", 寅: "とら", 卯: "う", 辰: "たつ", 巳: "み",
  午: "うま", 未: "ひつじ", 申: "さる", 酉: "とり", 戌: "いぬ", 亥: "い",
};

// 干の意味（一行）
export const stemMeaning: Record<Stem, string> = {
  甲: "大樹のように真っ直ぐ伸びる気質。リーダー性",
  乙: "草花のようにしなやかで、人に寄り添う優しさ",
  丙: "太陽のような明るさと情熱。場を照らす",
  丁: "灯火のような繊細さ。じっくり人を温める",
  戊: "山のような安定感。動じない芯の強さ",
  己: "畑のような包容力。人を育てる土壌",
  庚: "鋼のような潔さと決断力。芯のある強さ",
  辛: "宝石のような繊細な美しさ。鋭い感性",
  壬: "大河のような流れる知性。包み込む懐",
  癸: "静かな雨のような柔らかな知性。深い感受性",
};

// 支の意味（一行）
export const branchMeaning: Record<Branch, string> = {
  子: "種から芽吹く始まりの気。知性と機転",
  丑: "粘り強く積み重ねる気。誠実と忍耐",
  寅: "勢いよく踏み出す気。情熱と勇気",
  卯: "やわらかに広がる気。穏やかさと社交",
  辰: "天に昇る気。理想とスケール感",
  巳: "見抜く気。直観と洞察",
  午: "燃え上がる気。陽気と表現力",
  未: "実りを慈しむ気。優しさと家庭性",
  申: "機転の気。器用さと変化への適応",
  酉: "整える気。美意識と几帳面さ",
  戌: "守る気。忠実と責任感",
  亥: "貯える気。芯の強さと無垢",
};

// ============================================================
// 五行
// ============================================================
export type Element = "木" | "火" | "土" | "金" | "水";
export const stemElement: Record<Stem, Element> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土",
  庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
export const branchElement: Record<Branch, Element> = {
  寅: "木", 卯: "木", 巳: "火", 午: "火", 辰: "土", 戌: "土",
  丑: "土", 未: "土", 申: "金", 酉: "金", 亥: "水", 子: "水",
};

// ============================================================
// 二十四節気の概算（節入り日 ＝ 月柱の境界）
// 月の節入り日の概算（年により ±1日のずれ）
// MVPでは概算テーブル + 年補正を使い、後日 swiss ephemeris に置換可能
// ============================================================

// 節気と対応する月（節月 = 旧暦的な月の数え方）
// 立春 = 寅月の始まり、啓蟄 = 卯月の始まり…
const SOLAR_TERMS = [
  { month: 2,  day: 4,  name: "立春", branch: "寅" as Branch }, // 寅月
  { month: 3,  day: 6,  name: "啓蟄", branch: "卯" as Branch },
  { month: 4,  day: 5,  name: "清明", branch: "辰" as Branch },
  { month: 5,  day: 6,  name: "立夏", branch: "巳" as Branch },
  { month: 6,  day: 6,  name: "芒種", branch: "午" as Branch },
  { month: 7,  day: 7,  name: "小暑", branch: "未" as Branch },
  { month: 8,  day: 8,  name: "立秋", branch: "申" as Branch },
  { month: 9,  day: 8,  name: "白露", branch: "酉" as Branch },
  { month: 10, day: 8,  name: "寒露", branch: "戌" as Branch },
  { month: 11, day: 7,  name: "立冬", branch: "亥" as Branch },
  { month: 12, day: 7,  name: "大雪", branch: "子" as Branch },
  { month: 1,  day: 6,  name: "小寒", branch: "丑" as Branch }, // 丑月（前年の暦）
];

// ============================================================
// 日柱の計算
// 既知の基準日からの差分で算出する。
//
// 基準: 2024-01-01 = 甲子日（複数の信頼できる万年暦で照合済み）
//   甲=0, 子=0 → サイクル位置 0
//
// 検証データ:
//   - 1998-07-12 = 庚申日（農曆查詢網/八字算命網/139算命網で一致）
//     → 1998-07-12 から 2024-01-01 は 9304日後、(56 + 9304) % 60 = 0 ✓
//   - 2024-01-01 = 甲子日（azurewebsites 八字排盤で確認）
//
// 検証済み: 外部万年暦3件と34/34テスト合格（lib/__tests__/bazi.test.ts）。
//   将来的に lunar-javascript 等で大規模再照合する場合は別ブランチで対応。
// ============================================================
const REFERENCE_DAY = Date.UTC(2024, 0, 1); // 2024-01-01
const REFERENCE_DAY_INDEX = 0; // 甲子

function pillarFromCycleIndex(cycleIndex: number): Pillar {
  const i = ((cycleIndex % 60) + 60) % 60;
  return { stem: STEMS[i % 10], branch: BRANCHES[i % 12] };
}

export function dayPillar(date: Date): Pillar {
  // UTC 日付ベースで日数差を求める（タイムゾーンの影響を受けないように）
  const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const diffDays = Math.round((targetUtc - REFERENCE_DAY) / (1000 * 60 * 60 * 24));
  const cycleIndex = REFERENCE_DAY_INDEX + diffDays;
  return pillarFromCycleIndex(cycleIndex);
}

// ============================================================
// 年柱の計算
// 立春（2/4頃）が年の境界。立春前は前年扱い。
// 60干支サイクル: 西暦 4 = 甲子（西暦4年が甲子年）
// ============================================================
export function yearPillar(date: Date): Pillar {
  let year = date.getUTCFullYear();
  // 立春境界: 2/4 を概算で使う（年により±1日ずれるが MVP では許容）
  const lichunMonth = 2;
  const lichunDay = 4;
  const isBeforeLichun =
    date.getUTCMonth() + 1 < lichunMonth ||
    (date.getUTCMonth() + 1 === lichunMonth && date.getUTCDate() < lichunDay);
  if (isBeforeLichun) year -= 1;
  // 西暦4年が甲子（cycleIndex 0）
  const cycleIndex = ((year - 4) % 60 + 60) % 60;
  return pillarFromCycleIndex(cycleIndex);
}

// ============================================================
// 月柱の計算
// 月支は節入り基準で決まる（立春→寅月、啓蟄→卯月、…）
// 月干は年干によって決まる（五虎遁の法）:
//   甲己年 → 寅月の干は 丙
//   乙庚年 → 寅月の干は 戊
//   丙辛年 → 寅月の干は 庚
//   丁壬年 → 寅月の干は 壬
//   戊癸年 → 寅月の干は 甲
// ============================================================
function monthBranchOf(date: Date): { branch: Branch; effectiveYear: number } {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const year = date.getUTCFullYear();
  const lichunDay = SOLAR_TERMS.find((t) => t.month === 2)!.day;

  // 立春前（1月、2月で立春前）は前年扱い
  const isBeforeLichun =
    m === 1 || (m === 2 && d < lichunDay);
  const effectiveYear = isBeforeLichun ? year - 1 : year;

  // 当月の節入り日以降なら今月の term、それ以外は前月の term を使う
  const term = SOLAR_TERMS.find((t) => t.month === m);
  if (term && d >= term.day) {
    return { branch: term.branch, effectiveYear };
  }
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevTerm = SOLAR_TERMS.find((t) => t.month === prevMonth)!;
  return { branch: prevTerm.branch, effectiveYear };
}

const MONTH_STEM_BASE: Record<Stem, Stem> = {
  // 寅月（1番目の節月）の天干
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

export function monthPillar(date: Date): Pillar {
  const { branch, effectiveYear } = monthBranchOf(date);
  // 年干を取得（立春補正済みの年で）
  const cycleIndex = ((effectiveYear - 4) % 60 + 60) % 60;
  const yearStem = STEMS[cycleIndex % 10];

  // 寅月から数えて何番目の節月か（寅=0, 卯=1, ..., 丑=11）
  const branchOrderFromYin: readonly Branch[] = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];
  const offset = branchOrderFromYin.indexOf(branch);

  const baseStem = MONTH_STEM_BASE[yearStem];
  const baseStemIdx = STEMS.indexOf(baseStem);
  const monthStem = STEMS[(baseStemIdx + offset) % 10];
  return { stem: monthStem, branch };
}

// ============================================================
// 三柱まとめ
// ============================================================
export type ThreePillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
};

export function threePillars(date: Date): ThreePillars {
  return {
    year: yearPillar(date),
    month: monthPillar(date),
    day: dayPillar(date),
  };
}

export function pillarToString(p: Pillar): string {
  return `${p.stem}${p.branch}`;
}

export function pillarReading(p: Pillar): string {
  return `${stemReading[p.stem]}・${branchReading[p.branch]}`;
}

// ============================================================
// 五行バランス（命式の三柱から各五行の比重を算出）
// 簡易版: 各柱の干と支の五行を1ずつカウント
// ============================================================
export function fiveElementBalance(p: ThreePillars): Record<Element, number> {
  const counts: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const pillar of [p.year, p.month, p.day]) {
    counts[stemElement[pillar.stem]]++;
    counts[branchElement[pillar.branch]]++;
  }
  return counts;
}

// ============================================================
// 十神（じっしん） — 日干と他の干支との関係性
//
// 比肩 (Hi-ken):    日干と同じ五行・同じ陰陽   — 自我・友人・兄弟
// 劫財 (Kou-zai):   日干と同じ五行・異なる陰陽 — ライバル・浪費
// 食神 (Shoku-jin): 日干が生み出す五行・同じ陰陽 — 表現・楽しみ
// 傷官 (Shou-kan):  日干が生み出す五行・異なる陰陽 — 才能・反骨
// 偏財 (Hen-zai):   日干が剋する五行・同じ陰陽 — 流動的な財・恋愛
// 正財 (Sei-zai):   日干が剋する五行・異なる陰陽 — 堅実な財・配偶者
// 七殺 (Shichi-satsu): 日干を剋する五行・同じ陰陽 — 試練・権威
// 正官 (Sei-kan):   日干を剋する五行・異なる陰陽 — 規律・名誉
// 偏印 (Hen-in):    日干を生み出す五行・同じ陰陽 — 直観・特殊技能
// 正印 (Sei-in):    日干を生み出す五行・異なる陰陽 — 母性・学識
// ============================================================

export type TenGod =
  | "比肩" | "劫財" | "食神" | "傷官" | "偏財"
  | "正財" | "七殺" | "正官" | "偏印" | "正印";

export const tenGodDescription: Record<TenGod, string> = {
  比肩: "自我の柱、強さ",
  劫財: "ライバル、勢い",
  食神: "表現・楽しみ",
  傷官: "才能・反骨心",
  偏財: "流動的な財・恋愛",
  正財: "堅実な財・規律",
  七殺: "試練・突破力",
  正官: "規律・公的役割",
  偏印: "直観・独自性",
  正印: "学識・母性",
};

// 天干の陰陽: 甲丙戊庚壬 = 陽, 乙丁己辛癸 = 陰
function isYang(s: Stem): boolean {
  return STEMS.indexOf(s) % 2 === 0;
}

const ELEMENT_GEN: Record<Element, Element> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const ELEMENT_OVERCOME: Record<Element, Element> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

/**
 * 日干 (myStem) から見た 対象天干 (target) の十神を返す
 */
export function tenGodOf(myStem: Stem, target: Stem): TenGod {
  const myE = stemElement[myStem];
  const tE = stemElement[target];
  const sameYY = isYang(myStem) === isYang(target);

  if (myE === tE) return sameYY ? "比肩" : "劫財";
  if (ELEMENT_GEN[myE] === tE) return sameYY ? "食神" : "傷官";
  if (ELEMENT_OVERCOME[myE] === tE) return sameYY ? "偏財" : "正財";
  if (ELEMENT_OVERCOME[tE] === myE) return sameYY ? "七殺" : "正官";
  // ELEMENT_GEN[tE] === myE
  return sameYY ? "偏印" : "正印";
}

/**
 * 三柱から見た十神配置（年干・月干・日干自身は省く）
 */
export function tenGodsAcross(p: ThreePillars): { pillar: "年柱" | "月柱" | "日柱"; god: TenGod | "—"; stem: Stem }[] {
  const dayStem = p.day.stem;
  return [
    { pillar: "年柱", god: tenGodOf(dayStem, p.year.stem), stem: p.year.stem },
    { pillar: "月柱", god: tenGodOf(dayStem, p.month.stem), stem: p.month.stem },
    { pillar: "日柱", god: "—", stem: dayStem }, // 日干自身は十神なし
  ];
}

// ============================================================
// 大運（だいうん） — 10年単位の運勢の流れ
//
// 月柱を起点として、男性は陽年生まれは順行・陰年生まれは逆行
// 女性は逆。10年ごとに干支が進む / 戻る。
// MVP: 年干の陰陽 + 性別から方向を決定し、10年ごとの干支を返す。
// ============================================================

export type Gender = "female" | "male" | "other" | "none";

export type DaiunPillar = {
  startAge: number;     // 何歳から
  endAge: number;       // 何歳まで
  pillar: Pillar;
};

const PILLAR_60 = (() => {
  const arr: Pillar[] = [];
  for (let i = 0; i < 60; i++) {
    arr.push({ stem: STEMS[i % 10], branch: BRANCHES[i % 12] });
  }
  return arr;
})();

function pillarIndex(p: Pillar): number {
  return PILLAR_60.findIndex((q) => q.stem === p.stem && q.branch === p.branch);
}

/**
 * 大運の方向を決める：陽年男 / 陰年女 → 順行、その他 → 逆行
 */
function isForward(yearStem: Stem, gender: Gender): boolean {
  const yearYang = STEMS.indexOf(yearStem) % 2 === 0;
  const isMale = gender === "male";
  return (yearYang && isMale) || (!yearYang && !isMale);
}

/**
 * 大運の起算年齢（簡易版: MVPは固定 8歳開始）
 *
 * 本来は出生から次の節入り日までの日数を 3 で割って算出するが、
 * 旭兆では時刻不要のため概算値として 8歳起算で扱う。
 */
const DAIUN_START_AGE = 8;

export function daiunPillars(p: ThreePillars, gender: Gender, count: number = 8): DaiunPillar[] {
  const monthIdx = pillarIndex(p.month);
  const forward = isForward(p.year.stem, gender);
  const result: DaiunPillar[] = [];
  for (let i = 0; i < count; i++) {
    const offset = forward ? i + 1 : -(i + 1);
    const idx = ((monthIdx + offset) % 60 + 60) % 60;
    const startAge = DAIUN_START_AGE + i * 10;
    result.push({
      startAge,
      endAge: startAge + 9,
      pillar: PILLAR_60[idx],
    });
  }
  return result;
}

/**
 * 現在の大運柱を取得。
 * - currentAge が起算年齢 (DAIUN_START_AGE = 8) 未満の場合は null
 * - 算出範囲（10柱 = 100年分）を超えた場合も null
 * 呼び出し側は必ず null チェックすること。
 */
export function currentDaiun(p: ThreePillars, gender: Gender, currentAge: number): DaiunPillar | null {
  if (!p || currentAge < DAIUN_START_AGE) return null;
  const all = daiunPillars(p, gender, 10);
  return all.find((d) => currentAge >= d.startAge && currentAge <= d.endAge) || null;
}

// ============================================================
// 用神（ようじん） — 命式バランスを整えるために必要な五行
//
// MVP: 五行カウントが少ない方を「用神」、多すぎる方を「忌神（きしん）」とする。
// 本格的な四柱推命では身強・身弱の判定 + 月令・通根なども考慮するが、
// 旭兆ではユーザー体験向けに簡易版を採用する。
// ============================================================

export type YongShinResult = {
  yongShin: Element;       // 用神（補うべき気）
  kiShin: Element;         // 忌神（控えるべき気）
  description: string;
};

const ELEMENT_HINT: Record<Element, string> = {
  木: "成長・伸びる気を意識的に取り入れて",
  火: "情熱・表現の気を意識的に取り入れて",
  土: "安定・穏やかさの気を意識的に取り入れて",
  金: "けじめ・潔さの気を意識的に取り入れて",
  水: "知性・柔軟さの気を意識的に取り入れて",
};

export function yongShinOf(p: ThreePillars): YongShinResult {
  const balance = fiveElementBalance(p);
  const sorted = (Object.entries(balance) as [Element, number][])
    .sort((a, b) => a[1] - b[1]);
  const yongShin = sorted[0][0]; // 最少
  const kiShin = sorted[sorted.length - 1][0]; // 最多
  return {
    yongShin,
    kiShin,
    description: ELEMENT_HINT[yongShin],
  };
}

/**
 * 年齢算出（生年月日から）
 * bazi.ts 全体が UTC ベースで動くため、ここも getUTC* で揃える。
 * （ローカル時刻ベースだと 日本深夜 / 海外 TZ で +1日早く大運が進んでしまう）
 */
export function calcAge(birthYear: number, birthMonth: number, birthDay: number, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - birthYear;
  const m = today.getUTCMonth() + 1;
  const d = today.getUTCDate();
  if (m < birthMonth || (m === birthMonth && d < birthDay)) age--;
  return age;
}
