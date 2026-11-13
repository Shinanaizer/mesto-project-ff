import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHan,
  formatPoints,
  limitLabel,
  paymentLines,
  scoreHand,
  type Limit,
  type Winner,
  type WinBy,
} from "./score";

function expectRon(fu: number, han: number, winner: Winner, total: number, limit: Limit | null) {
  const score = scoreHand({ fu, han, winner, winBy: "ron" });
  const label = `${winner} ron ${fu} fu ${han} han`;
  assert.equal(score.total, total, label);
  assert.equal(score.limit, limit, `${label} limit`);
  assert.deepEqual(score.payments, [{ payer: "discarder", points: total, count: 1 }]);
}

function expectTsumo(
  fu: number,
  han: number,
  winner: Winner,
  expected: { total: number; limit: Limit | null; payments: { payer: string; points: number; count: number }[] },
) {
  const score = scoreHand({ fu, han, winner, winBy: "tsumo" });
  const label = `${winner} tsumo ${fu} fu ${han} han`;
  assert.equal(score.total, expected.total, label);
  assert.equal(score.limit, expected.limit, `${label} limit`);
  assert.deepEqual(score.payments, expected.payments, `${label} payments`);
}

describe("non-dealer ron", () => {
  const table: Array<[fu: number, han: number, total: number, limit: Limit | null]> = [
    [20, 1, 700, null],
    [20, 2, 1300, null],
    [20, 3, 2600, null],
    [20, 4, 5200, null],
    [25, 1, 800, null],
    [25, 2, 1600, null],
    [25, 3, 3200, null],
    [25, 4, 6400, null],
    [30, 1, 1000, null],
    [30, 2, 2000, null],
    [30, 3, 3900, null],
    [30, 4, 7700, null],
    [40, 1, 1300, null],
    [40, 2, 2600, null],
    [40, 3, 5200, null],
    [40, 4, 8000, "mangan"],
    [50, 2, 3200, null],
    [50, 3, 6400, null],
    [50, 4, 8000, "mangan"],
    [60, 1, 2000, null],
    [60, 2, 3900, null],
    [60, 3, 7700, null],
    [60, 4, 8000, "mangan"],
    [70, 1, 2300, null],
    [70, 2, 4500, null],
    [70, 3, 8000, "mangan"],
    [80, 2, 5200, null],
    [90, 1, 2900, null],
    [100, 2, 6400, null],
    [110, 1, 3600, null],
    [110, 2, 7100, null],
    [120, 2, 7700, null],
    [130, 2, 8000, "mangan"],
    [20, 5, 8000, "mangan"],
    [30, 5, 8000, "mangan"],
    [110, 5, 8000, "mangan"],
  ];

  for (const [fu, han, total, limit] of table) {
    it(`${fu} fu ${han} han → ${total}`, () => {
      expectRon(fu, han, "nonDealer", total, limit);
    });
  }
});

describe("dealer ron is not 1.5× the rounded non-dealer score", () => {
  it("30 fu 1–4 han", () => {
    expectRon(30, 1, "dealer", 1500, null);
    expectRon(30, 2, "dealer", 2900, null);
    expectRon(30, 3, "dealer", 5800, null);
    expectRon(30, 4, "dealer", 11600, null);
  });

  it("keeps the unrounded basic points", () => {
    expectRon(40, 2, "dealer", 3900, null);
    expectRon(40, 3, "dealer", 7700, null);
    expectRon(60, 2, "dealer", 5800, null);
    expectRon(25, 2, "dealer", 2400, null);
    expectRon(25, 3, "dealer", 4800, null);
    expectRon(25, 4, "dealer", 9600, null);
    expectRon(70, 2, "dealer", 6800, null);
  });

  it("enters mangan at 4 han 40 fu and at 5 han", () => {
    expectRon(40, 4, "dealer", 12000, "mangan");
    expectRon(30, 5, "dealer", 12000, "mangan");
    expectRon(20, 5, "dealer", 12000, "mangan");
  });
});

describe("no kiriage mangan", () => {
  it("4 han 30 fu and 3 han 60 fu stay at 7700 / 11600", () => {
    expectRon(30, 4, "nonDealer", 7700, null);
    expectRon(30, 4, "dealer", 11600, null);
    expectRon(60, 3, "nonDealer", 7700, null);
    expectRon(60, 3, "dealer", 11600, null);
  });
});

describe("tsumo payments are rounded per player", () => {
  it("non-dealer 30 fu", () => {
    expectTsumo(30, 1, "nonDealer", {
      total: 1100,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 300, count: 2 },
        { payer: "dealer", points: 500, count: 1 },
      ],
    });
    expectTsumo(30, 2, "nonDealer", {
      total: 2000,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 500, count: 2 },
        { payer: "dealer", points: 1000, count: 1 },
      ],
    });
    expectTsumo(30, 3, "nonDealer", {
      total: 4000,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 1000, count: 2 },
        { payer: "dealer", points: 2000, count: 1 },
      ],
    });
    expectTsumo(30, 4, "nonDealer", {
      total: 7900,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 2000, count: 2 },
        { payer: "dealer", points: 3900, count: 1 },
      ],
    });
  });

  it("dealer 30 fu can total more than the ron", () => {
    expectTsumo(30, 1, "dealer", {
      total: 1500,
      limit: null,
      payments: [{ payer: "nonDealer", points: 500, count: 3 }],
    });
    expectTsumo(30, 2, "dealer", {
      total: 3000,
      limit: null,
      payments: [{ payer: "nonDealer", points: 1000, count: 3 }],
    });
    expectTsumo(30, 3, "dealer", {
      total: 6000,
      limit: null,
      payments: [{ payer: "nonDealer", points: 2000, count: 3 }],
    });
    expectTsumo(30, 4, "dealer", {
      total: 11700,
      limit: null,
      payments: [{ payer: "nonDealer", points: 3900, count: 3 }],
    });
  });

  it("40 fu and 20 fu splits", () => {
    expectTsumo(40, 2, "nonDealer", {
      total: 2700,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 700, count: 2 },
        { payer: "dealer", points: 1300, count: 1 },
      ],
    });
    expectTsumo(40, 2, "dealer", {
      total: 3900,
      limit: null,
      payments: [{ payer: "nonDealer", points: 1300, count: 3 }],
    });
    expectTsumo(20, 2, "nonDealer", {
      total: 1500,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 400, count: 2 },
        { payer: "dealer", points: 700, count: 1 },
      ],
    });
    expectTsumo(20, 3, "dealer", {
      total: 3900,
      limit: null,
      payments: [{ payer: "nonDealer", points: 1300, count: 3 }],
    });
    expectTsumo(25, 3, "nonDealer", {
      total: 3200,
      limit: null,
      payments: [
        { payer: "nonDealer", points: 800, count: 2 },
        { payer: "dealer", points: 1600, count: 1 },
      ],
    });
  });

  it("mangan tsumo uses the fixed split", () => {
    expectTsumo(40, 4, "nonDealer", {
      total: 8000,
      limit: "mangan",
      payments: [
        { payer: "nonDealer", points: 2000, count: 2 },
        { payer: "dealer", points: 4000, count: 1 },
      ],
    });
    expectTsumo(30, 5, "dealer", {
      total: 12000,
      limit: "mangan",
      payments: [{ payer: "nonDealer", points: 4000, count: 3 }],
    });
    expectTsumo(70, 3, "nonDealer", {
      total: 8000,
      limit: "mangan",
      payments: [
        { payer: "nonDealer", points: 2000, count: 2 },
        { payer: "dealer", points: 4000, count: 1 },
      ],
    });
  });
});

describe("limit hands by han", () => {
  const bands: Array<[han: number, limit: Limit, nonDealer: number, dealer: number]> = [
    [5, "mangan", 8000, 12000],
    [6, "haneman", 12000, 18000],
    [7, "haneman", 12000, 18000],
    [8, "baiman", 16000, 24000],
    [9, "baiman", 16000, 24000],
    [10, "baiman", 16000, 24000],
    [11, "sanbaiman", 24000, 36000],
    [12, "sanbaiman", 24000, 36000],
    [13, "kazoeYakuman", 32000, 48000],
    [14, "kazoeYakuman", 32000, 48000],
    [26, "kazoeYakuman", 32000, 48000],
  ];

  for (const [han, limit, nonDealer, dealer] of bands) {
    it(`${han} han is ${limit} for both seats and does not depend on fu`, () => {
      for (const fu of [20, 30, 110]) {
        expectRon(fu, han, "nonDealer", nonDealer, limit);
        expectRon(fu, han, "dealer", dealer, limit);
      }
    });
  }

  it("kazoe yakuman tsumo matches a single yakuman", () => {
    expectTsumo(30, 13, "nonDealer", {
      total: 32000,
      limit: "kazoeYakuman",
      payments: [
        { payer: "nonDealer", points: 8000, count: 2 },
        { payer: "dealer", points: 16000, count: 1 },
      ],
    });
    expectTsumo(25, 13, "dealer", {
      total: 48000,
      limit: "kazoeYakuman",
      payments: [{ payer: "nonDealer", points: 16000, count: 3 }],
    });
  });
});

describe("copy for the table", () => {
  it("formats points and han", () => {
    assert.equal(formatPoints(7700), "7\u00a0700");
    assert.equal(formatPoints(32000), "32\u00a0000");
    assert.equal(formatPoints(500), "500");
    assert.equal(formatHan(4), "4");
    assert.equal(formatHan(13), "13+");
    assert.equal(formatHan(20), "13+");
  });

  it("describes who pays", () => {
    const ron = scoreHand({ fu: 30, han: 4, winner: "nonDealer", winBy: "ron" });
    assert.deepEqual(paymentLines(ron), ["Платит сбросивший"]);

    const tsumo = scoreHand({ fu: 30, han: 4, winner: "nonDealer", winBy: "tsumo" });
    assert.deepEqual(paymentLines(tsumo), [
      "Не-дилеры платят по 2\u00a0000",
      "Дилер платит 3\u00a0900",
    ]);

    const dealerTsumo = scoreHand({ fu: 30, han: 5, winner: "dealer", winBy: "tsumo" });
    assert.deepEqual(paymentLines(dealerTsumo), ["Каждый платит по 4\u00a0000"]);
  });
});

describe("rejects scores that are not a hand", () => {
  const bad: Array<[han: number, fu: number, winBy: WinBy]> = [
    [0, 30, "ron"],
    [-1, 30, "ron"],
    [1.5, 30, "tsumo"],
    [2, 0, "ron"],
    [2, -25, "tsumo"],
    [2, 30.5, "ron"],
  ];

  for (const [han, fu, winBy] of bad) {
    it(`han ${han} fu ${fu}`, () => {
      assert.throws(
        () => scoreHand({ han, fu, winner: "nonDealer", winBy }),
        RangeError,
      );
    });
  }
});

describe("named yakuman ignores han", () => {
  it("one yakuman is the yakuman limit, not the han score", () => {
    const score = scoreHand({ fu: 30, han: 4, winner: "nonDealer", winBy: "ron", yakuman: 1 });
    assert.equal(score.total, 32000);
    assert.equal(score.limit, "yakuman");
    assert.equal(score.yakumanCount, 1);
    assert.equal(limitLabel(score), "Якуман");
  });

  it("two yakuman is a double yakuman", () => {
    const ron = scoreHand({ fu: 40, han: 1, winner: "nonDealer", winBy: "ron", yakuman: 2 });
    assert.equal(ron.total, 64000);
    assert.equal(limitLabel(ron), "Двойной якуман");

    const tsumo = scoreHand({ fu: 30, han: 13, winner: "dealer", winBy: "tsumo", yakuman: 2 });
    assert.equal(tsumo.total, 96000);
    assert.deepEqual(tsumo.payments, [{ payer: "nonDealer", points: 32000, count: 3 }]);
  });

  it("a non-dealer yakuman tsumo splits 8000 and 16000", () => {
    const score = scoreHand({ fu: 30, han: 1, winner: "nonDealer", winBy: "tsumo", yakuman: 1 });
    assert.equal(score.total, 32000);
    assert.deepEqual(score.payments, [
      { payer: "nonDealer", points: 8000, count: 2 },
      { payer: "dealer", points: 16000, count: 1 },
    ]);
  });

  it("three yakuman multiplies the limit", () => {
    const score = scoreHand({ fu: 30, han: 1, winner: "nonDealer", winBy: "ron", yakuman: 3 });
    assert.equal(score.total, 96000);
    assert.equal(limitLabel(score), "Якуман × 3");
  });

  it("rejects a fractional yakuman count", () => {
    assert.throws(
      () => scoreHand({ fu: 30, han: 1, winner: "nonDealer", winBy: "ron", yakuman: 1.5 }),
      RangeError,
    );
  });
});
