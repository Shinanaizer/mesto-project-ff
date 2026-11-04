import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeExtraHan, changeFu, scoreParts, totalHan } from "./combine";

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
