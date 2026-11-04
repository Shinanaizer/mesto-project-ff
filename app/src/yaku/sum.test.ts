import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreHand } from "../scoring/score";
import { ZERO_COUNTERS, type HanCounters, type YakuId } from "./catalog";
import { dropClosedOnly, sumYaku, toggleYaku } from "./sum";

function counters(partial: Partial<HanCounters> = {}): HanCounters {
  return { ...ZERO_COUNTERS, ...partial };
}

function hand(selected: readonly YakuId[], closed = true, extra: Partial<HanCounters> = {}) {
  return sumYaku({ closed, selected, counters: counters(extra) });
}

describe("ordinary yaku sum", () => {
  it("starts empty", () => {
    assert.deepEqual(hand([]), { han: 0, yakuman: 0, active: false });
  });

  it("adds pinfu and tanyao", () => {
    assert.deepEqual(hand(["pinfu", "tanyao"]), { han: 2, yakuman: 0, active: true });
  });

  it("counts a selected yaku once", () => {
    assert.equal(hand(["tanyao", "tanyao"]).han, 1);
  });

  it("uses closed and open han where they differ", () => {
    const variable = [
      ["sanshokuDoujun", 2, 1],
      ["ittsu", 2, 1],
      ["chanta", 2, 1],
      ["junchan", 3, 2],
      ["honitsu", 3, 2],
      ["chinitsu", 6, 5],
    ] as const;
    for (const [id, closedHan, openHan] of variable) {
      assert.equal(hand([id], true).han, closedHan, `${id} closed`);
      assert.equal(hand([id], false).han, openHan, `${id} open`);
    }
  });

  it("keeps the same han open or closed when the yaku does not change", () => {
    for (const id of ["tanyao", "toitoi", "sanankou", "sankantsu", "sanshokuDoukou", "honroutou", "shousangen"] as const) {
      assert.equal(hand([id], true).han, hand([id], false).han, id);
    }
  });

  it("drops closed-only yaku when the hand is open", () => {
    assert.equal(hand(["riichi", "pinfu", "iipeikou", "chiitoitsu", "ryanpeikou"], false).han, 0);
    assert.equal(hand(["riichi", "tanyao"], false).han, 1);
    assert.deepEqual(dropClosedOnly(["riichi", "tanyao", "chinitsu"]), ["tanyao", "chinitsu"]);
  });
});

describe("dora and yakuhai counters", () => {
  it("adds each counter as one han", () => {
    const sum = hand(["tanyao"], true, { yakuhai: 2, dora: 1, uraDora: 1, akaDora: 1, kanDora: 1 });
    assert.equal(sum.han, 7);
    assert.equal(sum.yakuman, 0);
  });

  it("lets counters drive han with no yaku selected", () => {
    assert.deepEqual(hand([], true, { dora: 3 }), { han: 3, yakuman: 0, active: true });
  });

  it("rejects a negative counter", () => {
    assert.throws(
      () => sumYaku({ closed: true, selected: [], counters: counters({ akaDora: -1 }) }),
      RangeError,
    );
  });
});

describe("yakuman replaces han", () => {
  it("scores a single yakuman without adding han", () => {
    const sum = hand(["kokushi", "tanyao", "pinfu"], true, { dora: 3 });
    assert.equal(sum.yakuman, 1);
    assert.equal(sum.han, 5);
    const score = scoreHand({
      han: Math.max(sum.han, 1),
      fu: 30,
      winner: "nonDealer",
      winBy: "ron",
      yakuman: sum.yakuman,
    });
    assert.equal(score.total, 32000);
    assert.equal(score.limit, "yakuman");
    assert.equal(score.yakumanCount, 1);
  });

  it("stacks two different yakuman into a double", () => {
    const sum = hand(["daisangen", "tsuuiisou"]);
    assert.equal(sum.yakuman, 2);
    const score = scoreHand({
      han: 1,
      fu: 30,
      winner: "dealer",
      winBy: "ron",
      yakuman: sum.yakuman,
    });
    assert.equal(score.total, 96000);
    assert.equal(score.limit, "doubleYakuman");
  });

  it("counts a double-wait yakuman as two", () => {
    assert.equal(hand(["junseiChuuren"]).yakuman, 2);
    assert.equal(hand(["kokushiJuusan"]).yakuman, 2);
    assert.equal(hand(["suuankouTanki"]).yakuman, 2);
  });

  it("ignores a closed-only yakuman on an open hand", () => {
    assert.deepEqual(hand(["kokushi", "chuuren", "tenhou"], false), {
      han: 0,
      yakuman: 0,
      active: false,
    });
    assert.equal(hand(["daisangen"], false).yakuman, 1);
  });
});

describe("toggle does not stack a yaku with its stronger form", () => {
  it("switches riichi and daburu riichi", () => {
    assert.deepEqual(toggleYaku(["riichi", "tanyao"], "daburuRiichi"), ["tanyao", "daburuRiichi"]);
    assert.deepEqual(toggleYaku(["daburuRiichi"], "riichi"), ["riichi"]);
  });

  it("switches a yakuman and its double-wait form", () => {
    assert.deepEqual(toggleYaku(["kokushi"], "kokushiJuusan"), ["kokushiJuusan"]);
    assert.deepEqual(toggleYaku(["junseiChuuren"], "chuuren"), ["chuuren"]);
    assert.deepEqual(toggleYaku(["suuankouTanki"], "suuankou"), ["suuankou"]);
  });

  it("removes a yaku that is tapped again", () => {
    assert.deepEqual(toggleYaku(["pinfu", "tanyao"], "pinfu"), ["tanyao"]);
  });
});

describe("two yaku reach the points table", () => {
  it("pinfu and tanyao are 2 han, 2000 at 30 fu non-dealer ron", () => {
    const sum = hand(["pinfu", "tanyao"]);
    const score = scoreHand({
      han: sum.han,
      fu: 30,
      winner: "nonDealer",
      winBy: "ron",
      yakuman: sum.yakuman,
    });
    assert.equal(score.total, 2000);
    assert.equal(score.limit, null);
  });

  it("open chinitsu is mangan and closed chinitsu is haneman", () => {
    const open = hand(["chinitsu"], false);
    const closed = hand(["chinitsu"], true);
    assert.equal(scoreHand({ han: open.han, fu: 30, winner: "nonDealer", winBy: "ron" }).total, 8000);
    assert.equal(scoreHand({ han: closed.han, fu: 30, winner: "nonDealer", winBy: "ron" }).total, 12000);
  });
});
