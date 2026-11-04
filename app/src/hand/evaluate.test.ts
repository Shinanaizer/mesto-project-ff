import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseNotation } from "../tiles/tiles";
import { evaluateHand, type HandQuery } from "./evaluate";

function hand(notation: string, extra: Partial<HandQuery> = {}) {
  return evaluateHand({
    counts: parseNotation(notation),
    seat: "south",
    round: "east",
    winner: "nonDealer",
    winBy: "ron",
    dora: 0,
    winTile: null,
    ...extra,
  });
}

describe("hands read from tiles", () => {
  it("scores tanyao pinfu at 30 fu when the winning tile is a two-sided wait", () => {
    const open = hand("234m567m234p678p55s");
    assert.equal(open.yaku.some((yaku) => yaku.name === "Пинфу"), false);
    assert.match(open.waitNote ?? "", /пинфу не засчитан/);

    const reading = hand("234m567m234p678p55s", { winTile: 1 });
    assert.deepEqual(
      reading.yaku.map((yaku) => yaku.name),
      ["Пинфу", "Таняо"],
    );
    assert.equal(reading.fu, 30);
    assert.equal(reading.han, 2);
    assert.equal(reading.score?.total, 2000);
  });

  it("counts a seat-wind triplet as yakuhai", () => {
    const reading = hand("111z234m567m234p99s", { seat: "east", round: "south" });
    assert.deepEqual(
      reading.yaku.map((yaku) => yaku.name),
      ["Якухай, восток"],
    );
    assert.equal(reading.fu, 40);
    assert.equal(reading.han, 1);
    assert.equal(reading.score?.total, 1300);
  });

  it("scores seven pairs at 25 fu", () => {
    const reading = hand("1122m3344p5566s77z");
    assert.deepEqual(
      reading.yaku.map((yaku) => yaku.name),
      ["Тиитойцу"],
    );
    assert.equal(reading.fu, 25);
    assert.equal(reading.han, 2);
    assert.equal(reading.score?.total, 1600);
  });

  it("adds the dora counter on top of the tile han", () => {
    const reading = hand("1122m3344p5566s77z", { dora: 2 });
    assert.equal(reading.han, 4);
    assert.equal(reading.score?.total, 6400);
  });
});
