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
  it("scores tanyao pinfu at 20 fu when the winning tile is a two-sided wait", () => {
    const open = hand("234m567m234p678p55s");
    assert.equal(open.yaku.some((yaku) => yaku.name === "Пинфу"), false);
    assert.match(open.waitNote ?? "", /пинфу не засчитан/);

    const reading = hand("234m567m234p678p55s", { winTile: 1 });
    assert.deepEqual(
      reading.yaku.map((yaku) => yaku.name),
      ["Пинфу", "Таняо"],
    );
    assert.equal(reading.fu, 20);
    assert.equal(reading.han, 2);
    assert.equal(reading.score?.total, 1300);
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

function hanOf(reading: ReturnType<typeof hand>, name: string): number | undefined {
  return reading.yaku.find((yaku) => yaku.name === name)?.han;
}

describe("open hand", () => {
  const eastDealer = {
    seat: "east" as const,
    round: "east" as const,
    winner: "dealer" as const,
    winBy: "ron" as const,
    winTile: 10,
  };

  it("keeps closed yaku and han when the hand is menzen", () => {
    const reading = hand("123m456m789m234p55s", { ...eastDealer, closed: true });
    assert.deepEqual(
      reading.yaku.map((yaku) => `${yaku.name} ${yaku.han}`),
      ["Пинфу 1", "Итцу 2"],
    );
    assert.equal(reading.han, 3);
    assert.equal(reading.fu, 20);
    assert.equal(reading.score?.total, 3900);
  });

  it("drops menzen yaku and uses the open han", () => {
    const reading = hand("123m456m789m234p55s", { ...eastDealer, closed: false });
    assert.deepEqual(
      reading.yaku.map((yaku) => `${yaku.name} ${yaku.han}`),
      ["Итцу 1"],
    );
    assert.equal(reading.han, 1);
    assert.equal(reading.fu, 30);
    assert.equal(reading.score?.total, 1500);
    assert.equal(reading.waitNote, null);
  });

  it("uses open han for the yaku that change, and closed han otherwise", () => {
    const quiet = { seat: "south" as const, round: "west" as const };
    const cases = [
      ["123m123p123s456m99s", "Сансёку-додзюн", 2, 1],
      ["123m456m789m234p55s", "Итцу", 2, 1],
      ["123m789p111s999m11z", "Тянта", 2, 1],
      ["123m789m111p999s99m", "Дзюнтян", 3, 2],
      ["123m456m789m234m11z", "Хонъицу", 3, 2],
      ["123m456m789m234m55m", "Чинъицу", 6, 5],
    ] as const;
    for (const [notation, name, closedHan, openHan] of cases) {
      assert.equal(hanOf(hand(notation, { ...quiet, closed: true }), name), closedHan, name);
      assert.equal(hanOf(hand(notation, { ...quiet, closed: false }), name), openHan, `${name} open`);
    }
  });

  it("drops the other closed-only yaku the hand can find", () => {
    const iipeikou = hand("112233m456p789s44s", { closed: false });
    assert.equal(hanOf(iipeikou, "Иипейко"), undefined);

    const ryanpeikou = hand("112233m112233p44s", { closed: false });
    assert.equal(hanOf(ryanpeikou, "Рянпейко"), undefined);
    assert.equal(hanOf(hand("112233m112233p44s"), "Рянпейко"), 3);

    const tsumo = hand("234m567m234p678p55s", { winBy: "tsumo", winTile: 1, closed: false });
    assert.deepEqual(
      tsumo.yaku.map((yaku) => yaku.name),
      ["Таняо"],
    );
    assert.equal(tsumo.fu, 30);

    const pairs = hand("1122m3344p5566s77z", { closed: false });
    assert.equal(hanOf(pairs, "Тиитойцу"), undefined);
    assert.equal(pairs.han, 0);
    assert.equal(pairs.score, null);

    const kokushi = hand("19m19p19s12345677z", { closed: false });
    assert.equal(kokushi.yakuman, 0);
    assert.equal(kokushi.score, null);

    const suuankou = hand("111222333444m55p", { winBy: "tsumo", closed: false });
    assert.equal(suuankou.yakuman, 0);
    assert.equal(hanOf(suuankou, "Суанко"), undefined);
    assert.equal(hanOf(hand("111222333444m55p", { winBy: "tsumo" }), "Суанко"), 0);
    assert.equal(hand("111222333444m55p", { winBy: "tsumo" }).yakuman, 1);

    const chuuren = hand("11123456789999m", { closed: false });
    assert.equal(chuuren.yakuman, 0);
    assert.equal(hanOf(chuuren, "Чуурэн"), undefined);
    assert.equal(hanOf(chuuren, "Чинъицу"), 5);
  });
});

describe("a confirmed kan", () => {
  it("adds closed honor-kan fu and keeps a fourth tile that is not a kan ordinary", () => {
    const tiles = "5555z234m345p456s99m";
    assert.equal(hand(tiles).status, "incomplete");

    const reading = hand(tiles, { kans: [31] });
    assert.equal(reading.fu, 70);
    assert.equal(reading.han, 1);
    assert.equal(reading.score?.total, 2300);
    assert.equal(hanOf(reading, "Якухай, белый"), 1);
  });

  it("scores three open simple kans as sankantsu without closed-kan fu", () => {
    const reading = hand("2222m3333p4444s456m99p", { closed: false, kans: [1, 11, 21] });
    assert.equal(reading.fu, 50);
    assert.equal(hanOf(reading, "Санканцу"), 2);
    assert.equal(hanOf(reading, "Сананко"), undefined);
    assert.equal(reading.score?.total, 3200);
  });

  it("scores four kans as suukantsu", () => {
    const reading = hand("1111m2222p3333s4444m55z", { kans: [0, 10, 20, 3] });
    assert.equal(reading.yakuman, 1);
    assert.equal(reading.score?.total, 32000);
  });
});
