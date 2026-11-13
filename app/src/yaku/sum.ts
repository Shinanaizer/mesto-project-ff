import {
  COUNTER_MAX,
  YAKU,
  YAKU_BY_ID,
  YAKU_CONFLICTS,
  type HanCounters,
  type YakuId,
} from "./catalog";

export interface YakuSumInput {
  closed: boolean;
  selected: readonly YakuId[];
  counters: HanCounters;
}

export interface YakuSum {
  /** Han from ordinary yaku and counters. Not used once `yakuman` is above 0. */
  han: number;
  /** Named yakuman count. 2 is a double yakuman. Wins over `han`. */
  yakuman: number;
  /** The list should drive the calculator. */
  active: boolean;
}

function counterValue(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} должен быть целым от 0`);
  }
  return value;
}

export function sumYaku(input: YakuSumInput): YakuSum {
  const yakuhai = counterValue(input.counters.yakuhai, "Якухай");
  counterValue(input.counters.dora, "Дора");
  const uraDora = counterValue(input.counters.uraDora, "Ура-дора");
  const akaDora = counterValue(input.counters.akaDora, "Ака-дора");
  const kanDora = counterValue(input.counters.kanDora, "Кан-дора");

  // Dora is not a yaku. It is added later, and only when the hand already scores.
  let han = yakuhai + uraDora + akaDora + kanDora;
  let yakuman = 0;

  for (const id of new Set(input.selected)) {
    const yaku = YAKU_BY_ID.get(id);
    if (!yaku) throw new Error(`Неизвестное яку: ${id}`);
    if (yaku.closedOnly && !input.closed) continue;
    if (yaku.yakuman > 0) {
      yakuman += yaku.yakuman;
      continue;
    }
    han += input.closed ? yaku.closedHan : (yaku.openHan ?? 0);
  }

  return {
    han,
    yakuman,
    active: han > 0 || yakuman > 0,
  };
}

export function toggleYaku(selected: readonly YakuId[], id: YakuId): YakuId[] {
  if (!YAKU_BY_ID.has(id)) throw new Error(`Неизвестное яку: ${id}`);
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  const blocked = new Set(YAKU_CONFLICTS[id] ?? []);
  return [...selected.filter((item) => !blocked.has(item)), id];
}

export function dropClosedOnly(selected: readonly YakuId[]): YakuId[] {
  return selected.filter((id) => {
    const yaku = YAKU_BY_ID.get(id);
    return yaku != null && !yaku.closedOnly;
  });
}

/**
 * Han used for the points card. Dora adds only on top of a yaku or the han
 * counter. Dora alone is not a winning hand.
 */
export function winningHan(yakuHan: number, extraHan: number, dora: number): number {
  if (!Number.isSafeInteger(yakuHan) || yakuHan < 0) {
    throw new RangeError("Хан яку должен быть целым от 0");
  }
  if (!Number.isSafeInteger(extraHan) || extraHan < 0) {
    throw new RangeError("Дополнительный хан должен быть целым от 0");
  }
  if (!Number.isSafeInteger(dora) || dora < 0) {
    throw new RangeError("Дора должна быть целым от 0");
  }
  const base = yakuHan + extraHan;
  if (base < 1) return 0;
  return base + dora;
}

export function clampCounter(value: number): number {
  if (value < 0) return 0;
  if (value > COUNTER_MAX) return COUNTER_MAX;
  return value;
}

/** Distinct fixed fu of the yaku that actually count. Closed-only yaku are skipped on an open hand. */
export function impliedFuValues(selected: readonly YakuId[], closed: boolean): number[] {
  const values: number[] = [];
  for (const id of new Set(selected)) {
    const yaku = YAKU_BY_ID.get(id);
    if (!yaku) throw new Error(`Неизвестное яку: ${id}`);
    if (yaku.closedOnly && !closed) continue;
    if (!("fixedFu" in yaku) || yaku.fixedFu == null) continue;
    if (!values.includes(yaku.fixedFu)) values.push(yaku.fixedFu);
  }
  return values;
}

export function yakuHanText(id: YakuId): string {
  const yaku = YAKU_BY_ID.get(id);
  if (!yaku) return "";
  if (yaku.yakuman === 2) return "×2";
  if (yaku.yakuman === 1) return "якуман";
  if (yaku.openHan == null) return String(yaku.closedHan);
  if (yaku.openHan === yaku.closedHan) return String(yaku.closedHan);
  return `${yaku.closedHan} / ${yaku.openHan}`;
}

export function yakuShowsBothHan(id: YakuId): boolean {
  const yaku = YAKU_BY_ID.get(id);
  if (!yaku || yaku.yakuman > 0 || yaku.openHan == null) return false;
  return yaku.openHan !== yaku.closedHan;
}

export const ORDINARY_YAKU = YAKU.filter((yaku) => yaku.group === "yaku");
export const YAKUMAN_YAKU = YAKU.filter((yaku) => yaku.group === "yakuman");
