import { scoreHand, type Score, type WinBy, type Winner } from "./score";

/** Fu the counter can show. 0 means the user has not set fu. */
export const FU_LADDER = [0, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130] as const;

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
  /** Exactly the fu counter. 0 means unset. */
  fu: number;
  yakuman: number;
  winner: Winner;
  winBy: WinBy;
}

/**
 * Points from yaku han + extra han, and the fu counter alone.
 * Returns null when fu is below 20 or there is no han, unless a yakuman
 * sets the limit. Yakuman does not use fu and does not add extra han.
 */
export function scoreParts(parts: HandParts): Score | null {
  if (!Number.isSafeInteger(parts.fu) || parts.fu < 0) {
    throw new RangeError("Фу должны быть целым от 0");
  }
  if (!Number.isSafeInteger(parts.yakuman) || parts.yakuman < 0) {
    throw new RangeError("Число якуманов должно быть целым от 0");
  }
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
  if (han < 1 || parts.fu < 20) return null;
  return scoreHand({
    han,
    fu: parts.fu,
    winner: parts.winner,
    winBy: parts.winBy,
  });
}
