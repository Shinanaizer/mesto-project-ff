import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeExtraHan, changeFu, decideFu, scoreParts, totalHan } from "./combine";
import { ZERO_COUNTERS } from "../yaku/catalog";
import { impliedFuValues, sumYaku } from "../yaku/sum";

const base = {
  winner: "nonDealer" as const,
  winBy: "ron" as const,
  yakuman: 0,
};

describe("han is the yaku sum plus the extra counter", () => {
  it("scores yaku alone when the extra han counter is 0", () => {
    const score = scoreParts({ ...base, yakuHan: 2, extraHan: 0, fu: 30 });
    assert.equal(totalHan(2, 0), 2);
    assert.equal(score?.total, 2000);
    assert.equal(score?.han, 2);
  });

  it("adds extra han on top of the yaku sum", () => {
    const score = scoreParts({ ...base, yakuHan: 2, extraHan: 1, fu: 30 });
    assert.equal(totalHan(2, 1), 3);
    assert.equal(score?.total, 3900);
    assert.equal(score?.han, 3);
  });

  it("uses only the han counter when no yaku are selected", () => {
    const score = scoreParts({ ...base, yakuHan: 0, extraHan: 4, fu: 30 });
    assert.equal(score?.total, 7700);
    assert.equal(score?.han, 4);
  });

  it("does not score zero han", () => {
    assert.equal(scoreParts({ ...base, yakuHan: 0, extraHan: 0, fu: 30 }), null);
  });
});

describe("fu is only the fu counter", () => {
  it("keeps the chosen fu when yaku han changes", () => {
    const one = scoreParts({ ...base, yakuHan: 1, extraHan: 0, fu: 40 });
    const two = scoreParts({ ...base, yakuHan: 2, extraHan: 0, fu: 40 });
    assert.equal(one?.fu, 40);
    assert.equal(two?.fu, 40);
    assert.equal(one?.total, 1300);
    assert.equal(two?.total, 2600);
  });

  it("shows no points at fu 0", () => {
    assert.equal(scoreParts({ ...base, yakuHan: 2, extraHan: 0, fu: 0 }), null);
  });

  it("shows no points below the floor of 20", () => {
    assert.equal(scoreParts({ ...base, yakuHan: 2, extraHan: 1, fu: 10 }), null);
  });

  it("scores 20 fu as 20, not 20 plus a hidden minimum", () => {
    const score = scoreParts({ ...base, yakuHan: 1, extraHan: 0, fu: 20 });
    assert.equal(score?.fu, 20);
    assert.equal(score?.total, 700);
  });
});

describe("yakuman ignores both counters", () => {
  it("does not add extra han or require fu", () => {
    const score = scoreParts({
      ...base,
      yakuHan: 4,
      extraHan: 2,
      fu: 0,
      yakuman: 1,
    });
    assert.equal(score?.total, 32000);
    assert.equal(score?.limit, "yakuman");
  });
});

describe("yaku with fixed fu score when the counter is 0", () => {
  it("scores pinfu and tanyao at 20 fu", () => {
    const selected = ["pinfu", "tanyao"] as const;
    const sum = sumYaku({ closed: true, selected, counters: ZERO_COUNTERS });
    const implied = impliedFuValues(selected, true);
    assert.deepEqual(implied, [20]);
    const score = scoreParts({ ...base, yakuHan: sum.han, extraHan: 0, fu: 0, impliedFu: implied });
    assert.equal(decideFu(0, implied).status, "implied");
    assert.equal(score?.fu, 20);
    assert.equal(score?.han, 2);
    assert.equal(score?.total, 1300);
  });

  it("scores chiitoitsu at 25 fu", () => {
    const selected = ["chiitoitsu"] as const;
    const sum = sumYaku({ closed: true, selected, counters: ZERO_COUNTERS });
    const implied = impliedFuValues(selected, true);
    assert.deepEqual(implied, [25]);
    const score = scoreParts({ ...base, yakuHan: sum.han, extraHan: 0, fu: 0, impliedFu: implied });
    assert.equal(score?.fu, 25);
    assert.equal(score?.han, 2);
    assert.equal(score?.total, 1600);
  });

  it("keeps pinfu tsumo at 20 fu; menzen tsumo is only extra han", () => {
    const selected = ["pinfu", "menzenTsumo"] as const;
    const sum = sumYaku({ closed: true, selected, counters: ZERO_COUNTERS });
    const implied = impliedFuValues(selected, true);
    assert.deepEqual(implied, [20]);
    assert.equal(sum.han, 2);
    const score = scoreParts({
      ...base,
      yakuHan: sum.han,
      extraHan: 0,
      fu: 0,
      impliedFu: implied,
      winBy: "tsumo",
    });
    assert.equal(score?.fu, 20);
    assert.equal(score?.han, 2);
  });

  it("lets an explicit fu counter override the implied value", () => {
    const implied = impliedFuValues(["pinfu", "tanyao"], true);
    const score = scoreParts({ ...base, yakuHan: 2, extraHan: 0, fu: 30, impliedFu: implied });
    assert.equal(decideFu(30, implied).status, "explicit");
    assert.equal(score?.fu, 30);
    assert.equal(score?.total, 2000);
  });

  it("shows no points when implied fu values conflict and the counter is 0", () => {
    const implied = impliedFuValues(["pinfu", "chiitoitsu"], true);
    assert.deepEqual(implied, [20, 25]);
    assert.equal(decideFu(0, implied).status, "conflict");
    assert.equal(
      scoreParts({ ...base, yakuHan: 3, extraHan: 0, fu: 0, impliedFu: implied }),
      null,
    );
  });

  it("uses the counter even when implied fu values conflict", () => {
    const implied = impliedFuValues(["pinfu", "chiitoitsu"], true);
    const score = scoreParts({ ...base, yakuHan: 3, extraHan: 0, fu: 30, impliedFu: implied });
    assert.equal(score?.fu, 30);
    assert.equal(score?.han, 3);
    assert.equal(score?.total, 3900);
  });

  it("still shows no points for an ordinary yaku when fu is unset", () => {
    const implied = impliedFuValues(["tanyao"], true);
    assert.deepEqual(implied, []);
    assert.equal(decideFu(0, implied).status, "unknown");
    assert.equal(scoreParts({ ...base, yakuHan: 1, extraHan: 0, fu: 0, impliedFu: implied }), null);
  });

  it("ignores closed-only fixed fu when the hand is open", () => {
    assert.deepEqual(impliedFuValues(["pinfu", "chiitoitsu", "tanyao"], false), []);
  });
});

describe("counter steps", () => {
  it("starts fu at 0 and walks the usual values", () => {
    assert.equal(changeFu(0, 1), 20);
    assert.equal(changeFu(20, 1), 25);
    assert.equal(changeFu(25, 1), 30);
    assert.equal(changeFu(30, -1), 25);
    assert.equal(changeFu(0, -1), 0);
  });

  it("starts extra han at 0 and steps by one", () => {
    assert.equal(changeExtraHan(0, 1), 1);
    assert.equal(changeExtraHan(0, -1), 0);
    assert.equal(changeExtraHan(13, 1), 13);
  });
});
