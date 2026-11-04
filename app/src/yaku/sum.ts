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
  const dora = counterValue(input.counters.dora, "Дора");
  const uraDora = counterValue(input.counters.uraDora, "Ура-дора");
  const akaDora = counterValue(input.counters.akaDora, "Ака-дора");
  const kanDora = counterValue(input.counters.kanDora, "Кан-дора");

  let han = yakuhai + dora + uraDora + akaDora + kanDora;
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
