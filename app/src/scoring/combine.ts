import { scoreHand, type Score, type WinBy, type Winner } from "./score";

/** Fu the counter can show. 0 means the user has not set fu. */
export const FU_LADDER = [0, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130] as const;

/** Fu shown when the screen opens. 0 is still available one step below 20. */
export const DEFAULT_FU = 30;

export const EXTRA_HAN_MAX = 13;

export function changeFu(current: number, delta: -1 | 1): number {
  const index = FU_LADDER.indexOf(current as (typeof FU_LADDER)[number]);
  const at = index === -1 ? 0 : index;
  const next = Math.min(FU_LADDER.length - 1, Math.max(0, at + delta));
  return FU_LADDER[next];
}

export function changeExtraHan(current: number, delta: -1 | 1): number {
  if (!Number.isSafeInteger(current)) return 0;
  return Math.min(EXTRA_HAN_MAX, Math.max(0, current + delta));
}

/** Fu of one kan. Open is 8 or 16, closed is 16 or 32. */
export interface KanCounts {
  openSimple: number;
  openHonor: number;
  closedSimple: number;
  closedHonor: number;
}

export const ZERO_KANS: KanCounts = {
  openSimple: 0,
  openHonor: 0,
  closedSimple: 0,
  closedHonor: 0,
};

const KAN_FU: Record<keyof KanCounts, number> = {
  openSimple: 8,
  openHonor: 16,
  closedSimple: 16,
  closedHonor: 32,
};

export function changeKan(current: KanCounts, key: keyof KanCounts, delta: -1 | 1): KanCounts {
  const nextValue = current[key] + delta;
  if (!Number.isSafeInteger(nextValue) || nextValue < 0) return current;
  const next = { ...current, [key]: nextValue };
  const total = next.openSimple + next.openHonor + next.closedSimple + next.closedHonor;
  if (total > 4) return current;
  return next;
}

export function kanFu(kans: KanCounts): number {
  return (Object.keys(KAN_FU) as (keyof KanCounts)[]).reduce((sum, key) => sum + kans[key] * KAN_FU[key], 0);
}

/** Adds kan fu to a base that does not already include them, then rounds up to 10. */
export function fuWithKans(base: number, kans: KanCounts): number {
  const extra = kanFu(kans);
  if (extra === 0) return base;
  if (!Number.isSafeInteger(base) || base < 20) {
    throw new RangeError("Фу для кана должны быть от 20");
  }
  return Math.ceil((base + extra) / 10) * 10;
}

export function totalHan(yakuHan: number, extraHan: number): number {
  if (!Number.isSafeInteger(yakuHan) || yakuHan < 0) {
    throw new RangeError("Хан из яку должен быть целым от 0");
  }
  if (!Number.isSafeInteger(extraHan) || extraHan < 0) {
    throw new RangeError("Дополнительный хан должен быть целым от 0");
  }
  return yakuHan + extraHan;
}

export interface HandParts {
  /** Han from the yaku list and its dora counters. Not the extra han counter. */
  yakuHan: number;
  extraHan: number;
  /** Exactly the fu counter. 0 means unset. A value of 20 or more wins over implied fu. */
  fu: number;
  /** Fixed fu of the selected yaku that are actually scoring. Empty when none fix fu. */
  impliedFu?: readonly number[];
  yakuman: number;
  winner: Winner;
  winBy: WinBy;
  /** Kans are not part of the fu counter. Their fu is added and rounded up to 10. */
  kans?: KanCounts;
}

export type FuDecision =
  | { status: "explicit"; fu: number }
  | { status: "implied"; fu: number }
  | { status: "unknown" }
  | { status: "conflict" };

/**
 * The fu counter at 20 or above is the user's choice and always wins.
 * At 0, a single implied value is used. Several different implied values
 * are a conflict. No implied value leaves fu unknown.
 */
export function decideFu(counter: number, implied: readonly number[] = []): FuDecision {
  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new RangeError("Фу должны быть целым от 0");
  }
  for (const value of implied) {
    if (!Number.isSafeInteger(value) || value < 20) {
      throw new RangeError("Фиксированные фу яку должны быть целым от 20");
    }
  }
  if (counter >= 20) return { status: "explicit", fu: counter };
  const unique = [...new Set(implied)];
  if (unique.length === 0) return { status: "unknown" };
  if (unique.length > 1) return { status: "conflict" };
  return { status: "implied", fu: unique[0] };
}

/**
 * Points from yaku han + extra han, and either the fu counter or fixed fu
 * implied by the selected yaku. Returns null when fu is unknown, the implied
 * values conflict, or there is no han. A yakuman sets the limit without fu
 * and does not add extra han.
 */
export function scoreParts(parts: HandParts): Score | null {
  if (!Number.isSafeInteger(parts.yakuman) || parts.yakuman < 0) {
    throw new RangeError("Число якуманов должно быть целым от 0");
  }
  const decision = decideFu(parts.fu, parts.impliedFu ?? []);
  if (parts.yakuman >= 1) {
    return scoreHand({
      han: 1,
      fu: 30,
      winner: parts.winner,
      winBy: parts.winBy,
      yakuman: parts.yakuman,
    });
  }
  const han = totalHan(parts.yakuHan, parts.extraHan);
  if (han < 1) return null;
  if (decision.status !== "explicit" && decision.status !== "implied") return null;
  const kans = parts.kans ?? ZERO_KANS;
  return scoreHand({
    han,
    fu: fuWithKans(decision.fu, kans),
    winner: parts.winner,
    winBy: parts.winBy,
  });
}
