import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreHand } from "../scoring/score";
import {
  STARTING_SCORE,
  WRITE_OFF_DEFAULT,
  addHand,
  awardView,
  emptyLedger,
  finishGame,
  nextWriteOff,
  parseLedger,
  subtractPoints,
} from "./table";

describe("one score for the user", () => {
  it("starts at 25000 and adds a non-dealer ron of 3300", () => {
    const hand = scoreHand({ han: 2, fu: 30, winner: "nonDealer", winBy: "ron" });
    assert.equal(hand.total, 2000);
    assert.equal(hand.han, 2);
    const award = awardView(hand, 1, 1);
    assert.equal(award.total, 3300);
    assert.equal(addHand(STARTING_SCORE, { winBy: "ron", hand, sticks: 1, honba: 1 }), 28300);
  });

  it("does not change the payment text when there is no stick and no honba", () => {
    const hand = scoreHand({ han: 2, fu: 30, winner: "nonDealer", winBy: "ron" });
    assert.deepEqual(awardView(hand, 0, 0).lines, ["Платит сбросивший"]);
  });

  it("subtracts a loss from the same score", () => {
    assert.equal(subtractPoints(STARTING_SCORE, 1000), 24000);
  });

  it("builds a write-off from 1000 and 100, and stops at zero", () => {
    assert.equal(WRITE_OFF_DEFAULT, 1000);
    const built = nextWriteOff(nextWriteOff(nextWriteOff(WRITE_OFF_DEFAULT, 1000), 100), 100);
    assert.equal(built, 2200);
    assert.equal(nextWriteOff(100, -1000), 0);
    assert.equal(nextWriteOff(100000, 100), 100000);
  });

  it("archives the one score and starts the next game at 25000", () => {
    const finished = finishGame({ score: 28300, past: [] }, "2026-11-07T12:00:00.000Z");
    assert.equal(finished.past[0]?.date, "2026-11-07T12:00:00.000Z");
    assert.equal(finished.past[0]?.score, 28300);
    assert.equal(finished.score, STARTING_SCORE);
  });

  it("reads a saved ledger and drops a broken or old four-player one", () => {
    const raw = JSON.stringify({
      score: 28300,
      past: [{ date: "2026-11-07T12:00:00.000Z", score: 31000 }],
    });
    const ledger = parseLedger(raw);
    assert.equal(ledger.score, 28300);
    assert.equal(ledger.past[0]?.score, 31000);
    assert.deepEqual(parseLedger("nope"), emptyLedger());
    assert.deepEqual(
      parseLedger(JSON.stringify({ scores: { east: 1, south: 2, west: 3, north: 4 }, past: [] })),
      emptyLedger(),
    );
  });
});
