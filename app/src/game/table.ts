import { formatPoints, paymentLines, type Score, type WinBy } from "../scoring/score";

/** The user's own score at the start of a game. */
export const STARTING_SCORE = 25000;

/** One riichi stick. It is added to the winner and is not taken from the payer. */
export const STICK_VALUE = 1000;

/** One honba, paid in full by the ron loser. */
export const HONBA_VALUE = 300;

/** One honba on tsumo: each of the other three pays this. */
export const HONBA_EACH = 100;

export const BONUS_MAX = 20;

export interface PastGame {
  date: string;
  score: number;
}

export interface Ledger {
  score: number;
  past: PastGame[];
}

export interface SettleInput {
  winBy: WinBy;
  /** Points from the han table, without sticks or honba. */
  hand: Score;
  sticks: number;
  honba: number;
}

export function emptyLedger(): Ledger {
  return { score: STARTING_SCORE, past: [] };
}

export function clampBonus(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) return 0;
  return Math.min(BONUS_MAX, value);
}

/**
 * Winner's points: the han-table total, plus every stick, plus 300 per honba.
 * Han itself is not changed. With no sticks and no honba, the lines stay
 * the table's own payment text.
 */
export function awardView(hand: Score, sticks: number, honba: number): { total: number; lines: string[] } {
  assertBonus(sticks, honba);
  if (sticks === 0 && honba === 0) {
    return { total: hand.total, lines: paymentLines(hand) };
  }
  const stickPoints = sticks * STICK_VALUE;
  const total = hand.total + stickPoints + honba * HONBA_VALUE;
  const lines = hand.winBy === "ron" ? ronLines(hand, honba) : tsumoLines(hand, honba);
  if (stickPoints > 0) lines.push(`Палочки ${formatPoints(stickPoints)} победителю`);
  return { total, lines };
}

/** Adds the hand the user won, including sticks and honba, to their score. */
export function addHand(score: number, input: SettleInput): number {
  if (!Number.isSafeInteger(score)) throw new RangeError("Счёт должен быть целым");
  if (input.winBy !== input.hand.winBy) throw new Error("Вид победы не совпадает со счётом");
  return score + awardView(input.hand, input.sticks, input.honba).total;
}

/** The write-off pad opens on one riichi stick. */
export const WRITE_OFF_DEFAULT = 1000;

const WRITE_OFF_MAX = 100000;

/** Adds or removes 1000 or 100 from the amount waiting to be written off. */
export function nextWriteOff(amount: number, delta: number): number {
  if (!Number.isSafeInteger(amount) || amount < 0) return WRITE_OFF_DEFAULT;
  if (!Number.isSafeInteger(delta)) return amount;
  const next = amount + delta;
  if (next < 0) return 0;
  if (next > WRITE_OFF_MAX) return WRITE_OFF_MAX;
  return next;
}

export function subtractPoints(score: number, amount: number): number {
  if (!Number.isSafeInteger(score)) throw new RangeError("Счёт должен быть целым");
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new RangeError("Списание должно быть целым от 1");
  }
  return score - amount;
}

/** Archives the one score and opens a new game at the starting total. */
export function finishGame(ledger: Ledger, date: string): Ledger {
  if (date.trim() === "") throw new Error("Нужна дата");
  return {
    score: STARTING_SCORE,
    past: [{ date, score: ledger.score }, ...ledger.past],
  };
}

export function parseLedger(raw: string | null): Ledger {
  if (raw == null || raw.trim() === "") return emptyLedger();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyLedger();
  }
  if (!isRecord(parsed)) return emptyLedger();
  const score = readScore(parsed.score);
  const past = readPast(parsed.past);
  if (score == null || past == null) return emptyLedger();
  return { score, past };
}

function ronLines(hand: Score, honba: number): string[] {
  return [`Сбросивший платит ${formatPoints(hand.total + honba * HONBA_VALUE)}`];
}

function tsumoLines(hand: Score, honba: number): string[] {
  const extra = honba * HONBA_EACH;
  if (hand.winner === "dealer") {
    const each = (hand.payments[0]?.points ?? 0) + extra;
    return [`Каждый платит по ${formatPoints(each)}`];
  }
  const fromNonDealer = (hand.payments.find((payment) => payment.payer === "nonDealer")?.points ?? 0) + extra;
  const fromDealer = (hand.payments.find((payment) => payment.payer === "dealer")?.points ?? 0) + extra;
  return [
    `Не-дилеры платят по ${formatPoints(fromNonDealer)}`,
    `Дилер платит ${formatPoints(fromDealer)}`,
  ];
}

function assertBonus(sticks: number, honba: number): void {
  if (!Number.isSafeInteger(sticks) || sticks < 0) {
    throw new RangeError("Палочки должны быть целым от 0");
  }
  if (!Number.isSafeInteger(honba) || honba < 0) {
    throw new RangeError("Хонба должны быть целым от 0");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value);
}

function readScore(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) return null;
  return value;
}

function readPast(value: unknown): PastGame[] | null {
  if (!Array.isArray(value)) return null;
  const past: PastGame[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.date !== "string" || item.date.trim() === "") return null;
    const score = readScore(item.score);
    if (score == null) return null;
    past.push({ date: item.date, score });
  }
  return past;
}
