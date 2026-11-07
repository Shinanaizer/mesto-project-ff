import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateHand } from "./evaluate";
import { isDealerSeat } from "./dealerSeat";
import { parseNotation } from "../tiles/tiles";
import type { Wind } from "../tiles/tiles";

const TANYAO_PINFU = "234m567m234p678p55s";
const WIN_TILE = 1;

function scoreSeat(seat: Wind, round: Wind = "east") {
  return evaluateHand({
    counts: parseNotation(TANYAO_PINFU),
    seat,
    round,
    winner: isDealerSeat(seat) ? "dealer" : "nonDealer",
    winBy: "ron",
    dora: 0,
    winTile: WIN_TILE,
  });
}

describe("dealer follows the seat wind", () => {
  it("treats only East as the dealer", () => {
    assert.equal(isDealerSeat("east"), true);
    assert.equal(isDealerSeat("south"), false);
    assert.equal(isDealerSeat("west"), false);
    assert.equal(isDealerSeat("north"), false);
  });

  it("pays the dealer bonus once, and only for East", () => {
    const east = scoreSeat("east", "east");
    const south = scoreSeat("south", "east");
    const southRound = scoreSeat("south", "south");

    assert.equal(east.fu, 20);
    assert.equal(east.han, 2);
    assert.equal(south.fu, 20);
    assert.equal(south.han, 2);
    assert.equal(east.score?.total, 2000);
    assert.equal(south.score?.total, 1300);
    assert.equal(southRound.score?.total, 1300);
    assert.equal(scoreSeat("west").score?.total, 1300);
    assert.equal(scoreSeat("north").score?.total, 1300);
  });
});
