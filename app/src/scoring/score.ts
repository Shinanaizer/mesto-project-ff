/**
 * Japanese riichi points from fu and han.
 *
 * Basic points = fu × 2^(han + 2).
 * Ron: non-dealer ×4, dealer ×6, then round each total up to the next 100.
 * Tsumo: round each player's payment up to 100 separately
 * (non-dealer win: basic from each non-dealer and basic ×2 from the dealer;
 * dealer win: basic ×2 from each of the other three).
 * Han of 5 or more, or basic points of at least 2000, uses the limit table
 * instead (mangan, haneman, baiman, sanbaiman, kazoe yakuman).
 * 4 han 30 fu stays 7700: there is no kiriage mangan.
 * 13+ han is kazoe yakuman and does not become a double yakuman.
 */

export const HAN_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

export const FU_VALUES = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130] as const;

export type Winner = "dealer" | "nonDealer";
export type WinBy = "ron" | "tsumo";

export type Limit = "mangan" | "haneman" | "baiman" | "sanbaiman" | "kazoeYakuman";

export interface ScoreInput {
  han: number;
  fu: number;
  winner: Winner;
  winBy: WinBy;
}

export interface Payment {
  payer: "discarder" | "dealer" | "nonDealer";
  points: number;
  /** How many players pay this amount. */
  count: number;
}

export interface Score {
  han: number;
  fu: number;
  winner: Winner;
  winBy: WinBy;
  limit: Limit | null;
  /** Points the winner receives in total. */
  total: number;
  payments: Payment[];
}

interface LimitPayout {
  nonDealerRon: number;
  dealerRon: number;
  nonDealerTsumoFromNonDealer: number;
  nonDealerTsumoFromDealer: number;
  dealerTsumoEach: number;
}

const LIMITS: Record<Limit, LimitPayout> = {
  mangan: {
    nonDealerRon: 8000,
    dealerRon: 12000,
    nonDealerTsumoFromNonDealer: 2000,
    nonDealerTsumoFromDealer: 4000,
    dealerTsumoEach: 4000,
  },
  haneman: {
    nonDealerRon: 12000,
    dealerRon: 18000,
    nonDealerTsumoFromNonDealer: 3000,
    nonDealerTsumoFromDealer: 6000,
    dealerTsumoEach: 6000,
  },
  baiman: {
    nonDealerRon: 16000,
    dealerRon: 24000,
    nonDealerTsumoFromNonDealer: 4000,
    nonDealerTsumoFromDealer: 8000,
    dealerTsumoEach: 8000,
  },
  sanbaiman: {
    nonDealerRon: 24000,
    dealerRon: 36000,
    nonDealerTsumoFromNonDealer: 6000,
    nonDealerTsumoFromDealer: 12000,
    dealerTsumoEach: 12000,
  },
  kazoeYakuman: {
    nonDealerRon: 32000,
    dealerRon: 48000,
    nonDealerTsumoFromNonDealer: 8000,
    nonDealerTsumoFromDealer: 16000,
    dealerTsumoEach: 16000,
  },
};

export const LIMIT_LABELS: Record<Limit, string> = {
  mangan: "Манган",
  haneman: "Ханэман",
  baiman: "Байман",
  sanbaiman: "Санбайман",
  kazoeYakuman: "Кадзоэ-якуман",
};

const WINNER_LABELS: Record<Winner, string> = {
  dealer: "Дилер",
  nonDealer: "Не-дилер",
};

const WIN_BY_LABELS: Record<WinBy, string> = {
  ron: "рон",
  tsumo: "цумо",
};

export function formatPoints(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

export function formatHan(han: number): string {
  return han >= 13 ? "13+" : String(han);
}

export function winnerLabel(winner: Winner): string {
  return WINNER_LABELS[winner];
}

export function winByLabel(winBy: WinBy): string {
  return WIN_BY_LABELS[winBy];
}

/** Fu × 2^(han + 2). Only used below the limit table. */
export function basicPoints(fu: number, han: number): number {
  return fu * 2 ** (han + 2);
}

export function limitFor(han: number, fu: number): Limit | null {
  if (han >= 13) return "kazoeYakuman";
  if (han >= 11) return "sanbaiman";
  if (han >= 8) return "baiman";
  if (han >= 6) return "haneman";
  if (han >= 5 || basicPoints(fu, han) >= 2000) return "mangan";
  return null;
}

function roundUpTo100(points: number): number {
  const remainder = points % 100;
  if (remainder === 0) return points;
  return points + (100 - remainder);
}

function assertInput(input: ScoreInput): void {
  if (!Number.isSafeInteger(input.han) || input.han < 1) {
    throw new RangeError("Хан должен быть целым числом от 1");
  }
  if (!Number.isSafeInteger(input.fu) || input.fu < 1) {
    throw new RangeError("Фу должны быть положительным целым числом");
  }
}

function fromLimit(input: ScoreInput, limit: Limit): Score {
  const row = LIMITS[limit];
  if (input.winBy === "ron") {
    const total = input.winner === "dealer" ? row.dealerRon : row.nonDealerRon;
    return {
      ...input,
      limit,
      total,
      payments: [{ payer: "discarder", points: total, count: 1 }],
    };
  }
  if (input.winner === "dealer") {
    return {
      ...input,
      limit,
      total: row.dealerTsumoEach * 3,
      payments: [{ payer: "nonDealer", points: row.dealerTsumoEach, count: 3 }],
    };
  }
  return {
    ...input,
    limit,
    total: row.nonDealerTsumoFromNonDealer * 2 + row.nonDealerTsumoFromDealer,
    payments: [
      { payer: "nonDealer", points: row.nonDealerTsumoFromNonDealer, count: 2 },
      { payer: "dealer", points: row.nonDealerTsumoFromDealer, count: 1 },
    ],
  };
}

function fromFormula(input: ScoreInput): Score {
  const basic = basicPoints(input.fu, input.han);
  if (input.winBy === "ron") {
    const total = roundUpTo100(basic * (input.winner === "dealer" ? 6 : 4));
    return {
      ...input,
      limit: null,
      total,
      payments: [{ payer: "discarder", points: total, count: 1 }],
    };
  }
  if (input.winner === "dealer") {
    const each = roundUpTo100(basic * 2);
    return {
      ...input,
      limit: null,
      total: each * 3,
      payments: [{ payer: "nonDealer", points: each, count: 3 }],
    };
  }
  const fromNonDealer = roundUpTo100(basic);
  const fromDealer = roundUpTo100(basic * 2);
  return {
    ...input,
    limit: null,
    total: fromNonDealer * 2 + fromDealer,
    payments: [
      { payer: "nonDealer", points: fromNonDealer, count: 2 },
      { payer: "dealer", points: fromDealer, count: 1 },
    ],
  };
}

export function scoreHand(input: ScoreInput): Score {
  assertInput(input);
  const limit = limitFor(input.han, input.fu);
  return limit ? fromLimit(input, limit) : fromFormula(input);
}

/** Who pays, in Russian, for the table. The headline total is separate. */
export function paymentLines(score: Score): string[] {
  if (score.winBy === "ron") {
    return ["Платит сбросивший"];
  }
  if (score.winner === "dealer") {
    const each = score.payments[0]?.points ?? 0;
    return [`Каждый платит по ${formatPoints(each)}`];
  }
  const fromNonDealer = score.payments.find((payment) => payment.payer === "nonDealer");
  const fromDealer = score.payments.find((payment) => payment.payer === "dealer");
  return [
    `Не-дилеры платят по ${formatPoints(fromNonDealer?.points ?? 0)}`,
    `Дилер платит ${formatPoints(fromDealer?.points ?? 0)}`,
  ];
}
