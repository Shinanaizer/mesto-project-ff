/**
 * Standard riichi yaku and the usual han add-ons.
 * Han differs for some yaku when the hand is open; `openHan` is null
 * when that yaku exists only on a closed hand.
 * `yakuman` is 1 or 2 (double) and is not added to han.
 */

export interface YakuDef {
  id: string;
  name: string;
  description: string;
  group: "yaku" | "yakuman";
  closedOnly: boolean;
  /** Han on a closed hand. Unused when `yakuman` is greater than 0. */
  closedHan: number;
  /** Han on an open hand. Null means the yaku is closed-only. */
  openHan: number | null;
  yakuman: 0 | 1 | 2;
  /**
   * Fu this yaku always has, when it is actually scoring.
   * Pinfu is 20 (ron or tsumo). Chiitoitsu is 25.
   */
  fixedFu?: number;
}

export const YAKU = [
  {
    id: "riichi",
    name: "Риити",
    description: "Закрытая рука и объявленная ставка риити.",
    group: "yaku",
    closedOnly: true,
    closedHan: 1,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "daburuRiichi",
    name: "Дабури-риити",
    description: "Риити первой раздачей, ещё до чужих сбросов.",
    group: "yaku",
    closedOnly: true,
    closedHan: 2,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "ippatsu",
    name: "Иппацу",
    description: "Победа в первом круге после объявления риити.",
    group: "yaku",
    closedOnly: true,
    closedHan: 1,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "menzenTsumo",
    name: "Мендзен-цумо",
    description: "Цумо, и рука так и осталась закрытой.",
    group: "yaku",
    closedOnly: true,
    closedHan: 1,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "pinfu",
    name: "Пинфу",
    description: "Только последовательности, пара не якухай, ожидание с двух сторон.",
    group: "yaku",
    closedOnly: true,
    closedHan: 1,
    openHan: null,
    yakuman: 0,
    fixedFu: 20,
  },
  {
    id: "tanyao",
    name: "Таняо",
    description: "В руке нет терминалов и почётных плиток.",
    group: "yaku",
    closedOnly: false,
    closedHan: 1,
    openHan: 1,
    yakuman: 0,
  },
  {
    id: "iipeikou",
    name: "Иипейко",
    description: "Две одинаковые последовательности в закрытой руке.",
    group: "yaku",
    closedOnly: true,
    closedHan: 1,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "sanshokuDoujun",
    name: "Сансёку-додзюн",
    description: "Одна и та же последовательность в трёх мастях.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 1,
    yakuman: 0,
  },
  {
    id: "ittsu",
    name: "Итцу",
    description: "Последовательности 123, 456 и 789 одной масти.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 1,
    yakuman: 0,
  },
  {
    id: "chanta",
    name: "Тянта",
    description: "В каждом сете терминал или почётный, и есть обычная масть.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 1,
    yakuman: 0,
  },
  {
    id: "junchan",
    name: "Дзюнтян",
    description: "В каждом сете терминал, почётных плиток нет.",
    group: "yaku",
    closedOnly: false,
    closedHan: 3,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "toitoi",
    name: "Тойтой",
    description: "Все сеты — коцу или кан.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "sanankou",
    name: "Сананко",
    description: "Три закрытых коцу.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "sankantsu",
    name: "Санканцу",
    description: "Три кана.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "sanshokuDoukou",
    name: "Сансёку-доко",
    description: "Один и тот же коцу в трёх мастях.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "chiitoitsu",
    name: "Тиитойцу",
    description: "Семь пар.",
    group: "yaku",
    closedOnly: true,
    closedHan: 2,
    openHan: null,
    yakuman: 0,
    fixedFu: 25,
  },
  {
    id: "honroutou",
    name: "Хонрото",
    description: "Только терминалы и почётные, без плиток середины.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "shousangen",
    name: "Сёсангэн",
    description: "Два дракона коцу, третий дракон в паре.",
    group: "yaku",
    closedOnly: false,
    closedHan: 2,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "honitsu",
    name: "Хонъицу",
    description: "Одна масть и почётные плитки.",
    group: "yaku",
    closedOnly: false,
    closedHan: 3,
    openHan: 2,
    yakuman: 0,
  },
  {
    id: "ryanpeikou",
    name: "Рянпейко",
    description: "Две пары одинаковых последовательностей, рука закрыта.",
    group: "yaku",
    closedOnly: true,
    closedHan: 3,
    openHan: null,
    yakuman: 0,
  },
  {
    id: "chinitsu",
    name: "Чинъицу",
    description: "Одна масть, без почётных плиток.",
    group: "yaku",
    closedOnly: false,
    closedHan: 6,
    openHan: 5,
    yakuman: 0,
  },
  {
    id: "kokushi",
    name: "Кокуси",
    description: "Все 13 терминалов и почётных плюс пара любой из них.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 1,
  },
  {
    id: "suuankou",
    name: "Суанко",
    description: "Четыре закрытых коцу.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 1,
  },
  {
    id: "daisangen",
    name: "Дайсангэн",
    description: "Коцу всех трёх драконов.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "shousuushii",
    name: "Сёсусии",
    description: "Три ветра коцу, четвёртый ветер в паре.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "daisuushii",
    name: "Дайсусии",
    description: "Коцу всех четырёх ветров.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "tsuuiisou",
    name: "Цуйсо",
    description: "Только почётные плитки.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "chinroutou",
    name: "Чинрото",
    description: "Только терминалы, без почётных.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "ryuuiisou",
    name: "Рюисо",
    description: "Только зелёные плитки.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "chuuren",
    name: "Чуурэн",
    description: "1112345678999 одной масти и ещё одна плитка той же масти.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 1,
  },
  {
    id: "suukantsu",
    name: "Суканцу",
    description: "Четыре кана.",
    group: "yakuman",
    closedOnly: false,
    closedHan: 0,
    openHan: 0,
    yakuman: 1,
  },
  {
    id: "tenhou",
    name: "Тэнхо",
    description: "Дилер выиграл первой раздачей, ничего не сбросив.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 1,
  },
  {
    id: "chiihou",
    name: "Тихо",
    description: "Не-дилер выиграл первым цумо, до чужих сбросов.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 1,
  },
  {
    id: "kokushiJuusan",
    name: "Кокуси, 13 сторон",
    description: "Те же тринадцать плиток, ожидание на любую из них.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 2,
  },
  {
    id: "suuankouTanki",
    name: "Суанко танки",
    description: "Четыре закрытых коцу и ожидание именно в паре.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 2,
  },
  {
    id: "junseiChuuren",
    name: "Дзюнсэй чуурэн",
    description: "Девять врат с ожиданием на любую из девяти сторон.",
    group: "yakuman",
    closedOnly: true,
    closedHan: 0,
    openHan: null,
    yakuman: 2,
  },
] as const satisfies readonly YakuDef[];

export type YakuId = (typeof YAKU)[number]["id"];

export const YAKU_BY_ID: ReadonlyMap<YakuId, (typeof YAKU)[number]> = new Map(
  YAKU.map((yaku) => [yaku.id, yaku]),
);

/** Same call, not two yaku: picking one clears the other. */
export const YAKU_CONFLICTS: Partial<Record<YakuId, readonly YakuId[]>> = {
  riichi: ["daburuRiichi"],
  daburuRiichi: ["riichi"],
  kokushi: ["kokushiJuusan"],
  kokushiJuusan: ["kokushi"],
  suuankou: ["suuankouTanki"],
  suuankouTanki: ["suuankou"],
  chuuren: ["junseiChuuren"],
  junseiChuuren: ["chuuren"],
};

export interface HanCounters {
  yakuhai: number;
  dora: number;
  uraDora: number;
  akaDora: number;
  kanDora: number;
}

export const ZERO_COUNTERS: HanCounters = {
  yakuhai: 0,
  dora: 0,
  uraDora: 0,
  akaDora: 0,
  kanDora: 0,
};

export const COUNTER_MAX = 12;

export const COUNTERS = [
  {
    id: "yakuhai",
    name: "Якухай",
    description: "Коцу дракона, ветра раунда или ветра места. Каждый даёт хан.",
  },
  {
    id: "dora",
    name: "Дора",
    description: "Плитка по индикатору доры. Каждая даёт хан.",
  },
  {
    id: "uraDora",
    name: "Ура-дора",
    description: "Нижний индикатор после риити. Каждая даёт хан.",
  },
  {
    id: "akaDora",
    name: "Ака-дора",
    description: "Красная пятёрка. Каждая даёт хан.",
  },
  {
    id: "kanDora",
    name: "Кан-дора",
    description: "Новый индикатор после кана. Каждая даёт хан.",
  },
] as const satisfies readonly { id: keyof HanCounters; name: string; description: string }[];
