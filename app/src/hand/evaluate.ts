import { scoreHand, type Score, type WinBy, type Winner } from "../scoring/score";
import { YAKU_BY_ID, type YakuId } from "../yaku/catalog";
import {
  CHUN,
  EAST,
  HAKU,
  HATSU,
  isDragon,
  isHonor,
  isSimple,
  isTerminal,
  isTerminalOrHonor,
  NORTH,
  rankOf,
  SOUTH,
  suitOf,
  tileTotal,
  WEST,
  WIND_NAME,
  WIND_TILE,
  type Wind,
} from "../tiles/tiles";

export type WaitKind = "ryanmen" | "penchan" | "kanchan" | "tanki" | "shanpon";

export interface HandQuery {
  counts: readonly number[];
  seat: Wind;
  round: Wind;
  winner: Winner;
  winBy: WinBy;
  /** Dora indicators are not in the hand, so this stays a counter. */
  dora: number;
  /** When set, fu and pinfu use only this winning tile. */
  winTile: number | null;
  /**
   * Menzen when omitted or true. Open drops closed-only yaku and uses
   * the open han. There is no meld editor, so triplet fu stays closed.
   * A confirmed kan uses the same switch: closed hand means a closed kan.
   */
  closed?: boolean;
  /** Tile ids the player confirmed as kans. Each must occur four times. */
  kans?: readonly number[];
}

export interface FoundYaku {
  name: string;
  han: number;
}

export interface HandReading {
  status: "empty" | "incomplete" | "invalid" | "ready";
  yaku: FoundYaku[];
  han: number;
  fu: number | null;
  yakuman: number;
  score: Score | null;
  /** Set when a sequence hand could be pinfu, but the wait is not one shape. */
  waitNote: string | null;
  /** Tiles that can be the winning tile. */
  winningTiles: number[];
  /** This reading would be pinfu if the winning tile were a clear ryanmen. */
  pinfuBlocked: boolean;
}

interface Meld {
  kind: "seq" | "trip";
  tile: number;
}

interface StandardHand {
  pair: number;
  melds: Meld[];
}

const DRAGON_NAME: Record<number, string> = {
  [HAKU]: "белый",
  [HATSU]: "зелёный",
  [CHUN]: "красный",
};

const GREEN = new Set([19, 20, 21, 23, 25, HATSU]);
const KOKUSHI = [0, 8, 9, 17, 18, 26, EAST, SOUTH, WEST, NORTH, HAKU, HATSU, CHUN];

export function evaluateHand(query: HandQuery): HandReading {
  const counts = query.counts.slice();
  const total = tileTotal(counts);
  const kanTiles = confirmedKans(counts, query.kans);
  const kanCount = kanTiles.length;
  const blank: HandReading = {
    status: total === 0 ? "empty" : "incomplete",
    yaku: [],
    han: 0,
    fu: null,
    yakuman: 0,
    score: null,
    waitNote: null,
    winningTiles: [],
    pinfuBlocked: false,
  };
  if (total !== 14 + kanCount) return blank;

  const rest = counts.slice();
  for (const tile of kanTiles) rest[tile] -= 4;
  const meldCount = 4 - kanCount;
  const byTile = waitsByTile(rest, meldCount);
  const winningTiles = [...byTile.keys()];
  const waits = query.winTile == null ? uniqueKinds(byTile) : (byTile.get(query.winTile) ?? []);
  const formed = standardHands(rest, meldCount);
  const seven = kanCount === 0 && isChiitoitsu(counts);
  const options: HandReading[] = [];

  if (kanCount === 0 && isKokushi(counts)) pushLimit(options, query, "kokushi", 1);
  if (kanCount === 0 && formed.length > 0 && isChuuren(counts)) pushLimit(options, query, "chuuren", 1);
  if (formed.length > 0 && isDaisuushii(counts)) pushLimit(options, query, "daisuushii", 2);
  else if (formed.length > 0 && isShousuushii(counts)) pushLimit(options, query, "shousuushii", 1);
  if (formed.length > 0 && isDaisangen(counts)) pushLimit(options, query, "daisangen", 1);
  if (formed.length > 0 && isTsuuiisou(counts)) pushLimit(options, query, "tsuuiisou", 1);
  if (formed.length > 0 && isChinroutou(counts)) pushLimit(options, query, "chinroutou", 1);
  if ((formed.length > 0 || seven) && isRyuuiisou(counts)) pushLimit(options, query, "ryuuiisou", 1);
  if (kanCount === 4 && formed.length > 0) pushLimit(options, query, "suukantsu", 1);

  let bestBlocked = false;
  for (const hand of formed) {
    const found = yakuFromStandard(hand, counts, query, waits, kanTiles);
    const reading = finish(query, found.items, found.yakuman, found.fu);
    options.push(reading);
    if (found.pinfuBlocked) bestBlocked = true;
  }
  if (seven) {
    // Closed chiitoitsu is 25 fu, same as the counter. Open is not chiitoitsu.
    const fu = handIsClosed(query) ? fixedFuOf("chiitoitsu") : 30;
    options.push(finish(query, yakuFromPairs(counts, query), 0, fu));
  }

  if (options.length === 0) {
    return { ...blank, status: "invalid", winningTiles };
  }

  const best = options.reduce((top, item) => (pointsOf(item) > pointsOf(top) ? item : top));
  const sequenceScore = best.yaku.some((yaku) => yaku.name === "Пинфу");
  return {
    ...best,
    winningTiles,
    pinfuBlocked: bestBlocked && !sequenceScore && best.yakuman === 0,
    waitNote:
      bestBlocked && !sequenceScore && best.yakuman === 0
        ? "Ожидание неочевидно, пинфу не засчитан."
        : null,
  };
}

function confirmedKans(counts: readonly number[], kans: readonly number[] | undefined): number[] {
  if (kans == null) return [];
  const seen = new Set<number>();
  const confirmed: number[] = [];
  for (const tile of kans) {
    if (!Number.isInteger(tile) || tile < 0 || tile > 33 || seen.has(tile)) continue;
    if (counts[tile] < 4) continue;
    seen.add(tile);
    confirmed.push(tile);
  }
  return confirmed;
}

function waitsByTile(counts: readonly number[], melds = 4): Map<number, WaitKind[]> {
  const found = new Map<number, WaitKind[]>();
  for (let tile = 0; tile < 34; tile += 1) {
    if (counts[tile] === 0) continue;
    const kinds = tenpaiKinds(without(counts, tile), tile, melds);
    if (kinds.length > 0) found.set(tile, kinds);
  }
  return found;
}

function uniqueKinds(byTile: ReadonlyMap<number, readonly WaitKind[]>): WaitKind[] {
  const kinds = new Set<WaitKind>();
  for (const list of byTile.values()) {
    for (const kind of list) kinds.add(kind);
  }
  return [...kinds];
}

function pointsOf(reading: HandReading): number {
  return reading.score?.total ?? -1;
}

function handIsClosed(query: HandQuery): boolean {
  return query.closed !== false;
}

/** Closed-only yaku score only on a menzen hand. Han comes from the catalog. */
function ordinaryYaku(id: YakuId, closed: boolean): FoundYaku | null {
  const yaku = YAKU_BY_ID.get(id);
  if (!yaku || yaku.yakuman > 0) return null;
  if (!closed && yaku.closedOnly) return null;
  const han = closed ? yaku.closedHan : (yaku.openHan ?? 0);
  if (han <= 0) return null;
  return { name: yaku.name, han };
}

function pushYaku(items: FoundYaku[], id: YakuId, closed: boolean): void {
  const found = ordinaryYaku(id, closed);
  if (found) items.push(found);
}

function pushLimit(options: HandReading[], query: HandQuery, id: YakuId, yakuman: number): void {
  const yaku = YAKU_BY_ID.get(id);
  if (!yaku) return;
  if (!handIsClosed(query) && yaku.closedOnly) return;
  options.push(finish(query, [{ name: yaku.name, han: 0 }], yakuman, 30));
}

function finish(query: HandQuery, items: FoundYaku[], yakuman: number, fu: number): HandReading {
  const list = items.filter((item) => item.han > 0 || yakuman > 0);
  if (yakuman === 0 && query.dora > 0) list.push({ name: "Дора", han: query.dora });
  const han = yakuman > 0 ? 0 : list.reduce((sum, item) => sum + item.han, 0);
  if (yakuman === 0 && han < 1) {
    return {
      status: "ready",
      yaku: list,
      han: 0,
      fu,
      yakuman: 0,
      score: null,
      waitNote: null,
      winningTiles: [],
      pinfuBlocked: false,
    };
  }
  return {
    status: "ready",
    yaku: list,
    han,
    fu: yakuman > 0 ? null : fu,
    yakuman,
    score: scoreHand({
      han: yakuman > 0 ? 1 : han,
      fu: yakuman > 0 ? 30 : fu,
      winner: query.winner,
      winBy: query.winBy,
      yakuman,
    }),
    waitNote: null,
    winningTiles: [],
    pinfuBlocked: false,
  };
}

function yakuFromPairs(counts: readonly number[], query: HandQuery): FoundYaku[] {
  const closed = handIsClosed(query);
  const items: FoundYaku[] = [];
  pushYaku(items, "chiitoitsu", closed);
  pushSuitYaku(items, counts, closed);
  if (isTanyao(counts)) pushYaku(items, "tanyao", closed);
  if (isHonroutouTiles(counts) && !isChinroutou(counts) && !isTsuuiisou(counts)) {
    pushYaku(items, "honroutou", closed);
  }
  if (query.winBy === "tsumo") pushYaku(items, "menzenTsumo", closed);
  return items;
}

function yakuFromStandard(
  hand: StandardHand,
  counts: readonly number[],
  query: HandQuery,
  waits: readonly WaitKind[],
  kanTiles: readonly number[],
): { items: FoundYaku[]; yakuman: number; fu: number; pinfuBlocked: boolean } {
  const trips = hand.melds.filter((meld) => meld.kind === "trip");
  const seqs = hand.melds.filter((meld) => meld.kind === "seq");
  const tanki = waits.length === 1 && waits[0] === "tanki";
  const closed = handIsClosed(query);
  const ankou = trips.length + (closed ? kanTiles.length : 0);
  const suuankou = trips.length === 4 && seqs.length === 0 && (query.winBy === "tsumo" || tanki);

  if (suuankou && closed) {
    const id = tanki ? "suuankouTanki" : "suuankou";
    const name = YAKU_BY_ID.get(id)?.name ?? (tanki ? "Суанко танки" : "Суанко");
    return {
      items: [{ name, han: 0 }],
      yakuman: tanki ? 2 : 1,
      fu: 30,
      pinfuBlocked: false,
    };
  }

  const items: FoundYaku[] = [];
  let pinfuBlocked = false;
  const sequenceHand = seqs.length === 4;
  const valuedPair = pairIsYakuhai(hand.pair, query.seat, query.round);
  const ryanmen = waits.length === 1 && waits[0] === "ryanmen";
  if (closed && sequenceHand && !valuedPair) {
    if (ryanmen) pushYaku(items, "pinfu", true);
    else pinfuBlocked = true;
  }

  for (const tile of [...trips.map((trip) => trip.tile), ...kanTiles]) addYakuhai(items, tile, query);

  const pairs = sequencePairs(seqs);
  if (pairs >= 2 && trips.length === 0) pushYaku(items, "ryanpeikou", closed);
  else if (pairs === 1) pushYaku(items, "iipeikou", closed);
  if (hasSanshoku(seqs)) pushYaku(items, "sanshokuDoujun", closed);
  if (hasIttsu(seqs)) pushYaku(items, "ittsu", closed);
  if (seqs.length === 0 && trips.length + kanTiles.length === 4 && kanTiles.length < 4) {
    pushYaku(items, "toitoi", closed);
  }
  if (ankou >= 3) pushYaku(items, "sanankou", closed);
  if (kanTiles.length === 3) pushYaku(items, "sankantsu", closed);
  if (hasDoukou([...trips.map((trip) => trip.tile), ...kanTiles])) pushYaku(items, "sanshokuDoukou", closed);
  if (isJunchan(hand, kanTiles)) pushYaku(items, "junchan", closed);
  else if (isChanta(hand, kanTiles)) pushYaku(items, "chanta", closed);
  pushSuitYaku(items, counts, closed);
  if (isTanyao(counts)) pushYaku(items, "tanyao", closed);
  if (isHonroutouTiles(counts) && !isChinroutou(counts) && !isTsuuiisou(counts)) {
    pushYaku(items, "honroutou", closed);
  }
  if (dragonSets(trips, hand.pair, kanTiles) === "shou") pushYaku(items, "shousangen", closed);
  if (query.winBy === "tsumo") pushYaku(items, "menzenTsumo", closed);

  const pinfu = items.some((item) => item.name === "Пинфу");
  return {
    items,
    yakuman: 0,
    // Same fixed fu as the counter: closed pinfu is 20 on ron and on tsumo.
    fu: pinfu ? fixedFuOf("pinfu") : standardFu(hand, query, waits, kanTiles),
    pinfuBlocked,
  };
}

/** Fu the counter assigns to this yaku. Pinfu is 20, chiitoitsu is 25. */
function fixedFuOf(id: YakuId): number {
  const yaku = YAKU_BY_ID.get(id);
  if (yaku && "fixedFu" in yaku && yaku.fixedFu != null) return yaku.fixedFu;
  throw new Error(`У яку нет фиксированных фу: ${id}`);
}

function addYakuhai(items: FoundYaku[], tile: number, query: HandQuery): void {
  if (isDragon(tile)) {
    items.push({ name: `Якухай, ${DRAGON_NAME[tile]}`, han: 1 });
  }
  const wind = windName(tile);
  if (!wind) return;
  let han = 0;
  if (tile === WIND_TILE[query.seat]) han += 1;
  if (tile === WIND_TILE[query.round]) han += 1;
  if (han > 0) items.push({ name: `Якухай, ${wind}`, han });
}

function standardFu(
  hand: StandardHand,
  query: HandQuery,
  waits: readonly WaitKind[],
  kanTiles: readonly number[],
): number {
  let fu = 20;
  if (query.winBy === "tsumo") fu += 2;
  else if (handIsClosed(query)) fu += 10;
  // Which set was called is unknown, so a triplet keeps its closed fu.
  for (const meld of hand.melds) {
    if (meld.kind !== "trip") continue;
    fu += isTerminalOrHonor(meld.tile) ? 8 : 4;
  }
  const closedKan = handIsClosed(query);
  for (const tile of kanTiles) {
    const honor = isTerminalOrHonor(tile);
    if (closedKan) fu += honor ? 32 : 16;
    else fu += honor ? 16 : 8;
  }
  fu += pairFu(hand.pair, query.seat, query.round);
  if (waits.length === 1 && (waits[0] === "tanki" || waits[0] === "kanchan" || waits[0] === "penchan")) {
    fu += 2;
  }
  const rounded = Math.ceil(fu / 10) * 10;
  // Open hands are not pinfu, so 20 fu becomes 30 unless a triplet, pair, or wait already raised it.
  if (!handIsClosed(query) && rounded === 20) return 30;
  return rounded;
}

function pairFu(pair: number, seat: Wind, round: Wind): number {
  let fu = 0;
  if (isDragon(pair)) fu += 2;
  if (pair === WIND_TILE[seat]) fu += 2;
  if (pair === WIND_TILE[round]) fu += 2;
  return fu;
}

function pairIsYakuhai(pair: number, seat: Wind, round: Wind): boolean {
  return isDragon(pair) || pair === WIND_TILE[seat] || pair === WIND_TILE[round];
}

function pushSuitYaku(items: FoundYaku[], counts: readonly number[], closed: boolean): void {
  const suits = new Set<string>();
  let honors = false;
  for (let tile = 0; tile < 34; tile += 1) {
    if (counts[tile] === 0) continue;
    if (isHonor(tile)) honors = true;
    else suits.add(suitOf(tile));
  }
  if (suits.size !== 1) return;
  pushYaku(items, honors ? "honitsu" : "chinitsu", closed);
}

function sequencePairs(seqs: readonly Meld[]): number {
  const seen = new Map<number, number>();
  for (const meld of seqs) seen.set(meld.tile, (seen.get(meld.tile) ?? 0) + 1);
  let pairs = 0;
  for (const count of seen.values()) pairs += Math.floor(count / 2);
  return pairs;
}

function hasSanshoku(seqs: readonly Meld[]): boolean {
  const starts = new Set(seqs.map((meld) => meld.tile));
  for (let rank = 0; rank < 7; rank += 1) {
    if (starts.has(rank) && starts.has(9 + rank) && starts.has(18 + rank)) return true;
  }
  return false;
}

function hasIttsu(seqs: readonly Meld[]): boolean {
  const starts = new Set(seqs.map((meld) => meld.tile));
  for (const base of [0, 9, 18]) {
    if (starts.has(base) && starts.has(base + 3) && starts.has(base + 6)) return true;
  }
  return false;
}

function hasDoukou(tiles: readonly number[]): boolean {
  for (let rank = 0; rank < 9; rank += 1) {
    const suits = new Set(
      tiles.filter((tile) => tile < 27 && tile % 9 === rank).map((tile) => Math.floor(tile / 9)),
    );
    if (suits.size === 3) return true;
  }
  return false;
}

function isChanta(hand: StandardHand, kanTiles: readonly number[]): boolean {
  if (!isTerminalOrHonor(hand.pair)) return false;
  if (kanTiles.some((tile) => !isTerminalOrHonor(tile))) return false;
  return hand.melds.every((meld) => {
    if (meld.kind === "trip") return isTerminalOrHonor(meld.tile);
    const rank = rankOf(meld.tile);
    return rank === 1 || rank === 7;
  });
}

function isJunchan(hand: StandardHand, kanTiles: readonly number[]): boolean {
  if (isHonor(hand.pair) || !isTerminal(hand.pair)) return false;
  if (kanTiles.some((tile) => !isTerminal(tile))) return false;
  return hand.melds.every((meld) => {
    if (meld.kind === "trip") return isTerminal(meld.tile);
    const rank = rankOf(meld.tile);
    return rank === 1 || rank === 7;
  });
}

function dragonSets(trips: readonly Meld[], pair: number, kanTiles: readonly number[]): "dai" | "shou" | null {
  const dragons = new Set(trips.filter((meld) => isDragon(meld.tile)).map((meld) => meld.tile));
  for (const tile of kanTiles) {
    if (isDragon(tile)) dragons.add(tile);
  }
  if (dragons.size === 3) return "dai";
  if (dragons.size === 2 && isDragon(pair)) return "shou";
  return null;
}

function isTanyao(counts: readonly number[]): boolean {
  for (let tile = 0; tile < 34; tile += 1) {
    if (counts[tile] > 0 && !isSimple(tile)) return false;
  }
  return true;
}

function isHonroutouTiles(counts: readonly number[]): boolean {
  return counts.some((n) => n > 0) && counts.every((n, tile) => n === 0 || isTerminalOrHonor(tile));
}

function isKokushi(counts: readonly number[]): boolean {
  let pair = 0;
  for (let tile = 0; tile < 34; tile += 1) {
    const needed = KOKUSHI.includes(tile);
    if (!needed) {
      if (counts[tile] !== 0) return false;
      continue;
    }
    if (counts[tile] === 1) continue;
    if (counts[tile] === 2 && pair === 0) {
      pair = 1;
      continue;
    }
    return false;
  }
  return pair === 1;
}

function isChuuren(counts: readonly number[]): boolean {
  if (tileTotal(counts) !== 14) return false;
  for (const base of [0, 9, 18]) {
    const slice = counts.slice(base, base + 9);
    if (slice.reduce((sum, n) => sum + n, 0) !== 14) continue;
    if (slice[0] >= 3 && slice[8] >= 3 && slice.slice(1, 8).every((n) => n >= 1)) return true;
  }
  return false;
}

function isDaisangen(counts: readonly number[]): boolean {
  return counts[HAKU] >= 3 && counts[HATSU] >= 3 && counts[CHUN] >= 3;
}

function isShousuushii(counts: readonly number[]): boolean {
  const winds = [EAST, SOUTH, WEST, NORTH];
  const trips = winds.filter((tile) => counts[tile] >= 3).length;
  const pair = winds.filter((tile) => counts[tile] === 2).length;
  return trips === 3 && pair === 1;
}

function isDaisuushii(counts: readonly number[]): boolean {
  return [EAST, SOUTH, WEST, NORTH].every((tile) => counts[tile] >= 3);
}

function isTsuuiisou(counts: readonly number[]): boolean {
  return counts.some((n) => n > 0) && counts.every((n, tile) => n === 0 || isHonor(tile));
}

function isChinroutou(counts: readonly number[]): boolean {
  return counts.some((n) => n > 0) && counts.every((n, tile) => n === 0 || isTerminal(tile));
}

function isRyuuiisou(counts: readonly number[]): boolean {
  return counts.some((n) => n > 0) && counts.every((n, tile) => n === 0 || GREEN.has(tile));
}

function isChiitoitsu(counts: readonly number[]): boolean {
  let pairs = 0;
  for (const n of counts) {
    if (n === 0) continue;
    if (n !== 2) return false;
    pairs += 1;
  }
  return pairs === 7;
}

function windName(tile: number): string | null {
  if (tile === EAST) return WIND_NAME.east;
  if (tile === SOUTH) return WIND_NAME.south;
  if (tile === WEST) return WIND_NAME.west;
  if (tile === NORTH) return WIND_NAME.north;
  return null;
}

function standardHands(counts: readonly number[], meldCount = 4): StandardHand[] {
  const found: StandardHand[] = [];
  const seen = new Set<string>();
  const countsCopy = counts.slice();
  for (let pair = 0; pair < 34; pair += 1) {
    if (countsCopy[pair] < 2) continue;
    countsCopy[pair] -= 2;
    collectMelds(countsCopy, [], meldCount, (melds) => {
      const key = `${pair}|${melds
        .map((meld) => `${meld.kind}${meld.tile}`)
        .sort()
        .join(",")}`;
      if (seen.has(key)) return;
      seen.add(key);
      found.push({ pair, melds: melds.map((meld) => ({ ...meld })) });
    });
    countsCopy[pair] += 2;
  }
  return found;
}

function collectMelds(
  counts: number[],
  melds: Meld[],
  need: number,
  onDone: (melds: Meld[]) => void,
): void {
  if (melds.length === need) {
    if (counts.every((n) => n === 0)) onDone(melds);
    return;
  }
  let tile = 0;
  while (tile < 34 && counts[tile] === 0) tile += 1;
  if (tile >= 34) return;
  if (counts[tile] >= 3) {
    counts[tile] -= 3;
    melds.push({ kind: "trip", tile });
    collectMelds(counts, melds, need, onDone);
    melds.pop();
    counts[tile] += 3;
  }
  if (tile < 27 && rankOf(tile) <= 7 && counts[tile + 1] > 0 && counts[tile + 2] > 0) {
    counts[tile] -= 1;
    counts[tile + 1] -= 1;
    counts[tile + 2] -= 1;
    melds.push({ kind: "seq", tile });
    collectMelds(counts, melds, need, onDone);
    melds.pop();
    counts[tile] += 1;
    counts[tile + 1] += 1;
    counts[tile + 2] += 1;
  }
}

function without(counts: readonly number[], tile: number): number[] {
  const next = counts.slice();
  next[tile] -= 1;
  return next;
}

function tenpaiKinds(counts: readonly number[], win: number, melds = 4): WaitKind[] {
  const kinds = new Set<WaitKind>();
  const tiles = counts.slice();
  if (tiles[win] >= 1) {
    tiles[win] -= 1;
    if (exactMelds(tiles, melds)) kinds.add("tanki");
    tiles[win] += 1;
  }
  if (melds === 0) return [...kinds];
  for (let pair = 0; pair < 34; pair += 1) {
    if (tiles[pair] < 2) continue;
    tiles[pair] -= 2;
    for (let a = 0; a < 34; a += 1) {
      if (tiles[a] === 0) continue;
      for (let b = a; b < 34; b += 1) {
        if (a === b ? tiles[a] < 2 : tiles[b] === 0) continue;
        tiles[a] -= 1;
        tiles[b] -= 1;
        if (exactMelds(tiles, melds - 1)) {
          if (a === b && a === win) kinds.add("shanpon");
          const shape = a === b ? null : taatsuShape(a, b, win);
          if (shape) kinds.add(shape);
        }
        tiles[a] += 1;
        tiles[b] += 1;
      }
    }
    tiles[pair] += 2;
  }
  return [...kinds];
}

function taatsuShape(a: number, b: number, win: number): WaitKind | null {
  if (suitOf(a) !== suitOf(b) || suitOf(a) !== suitOf(win) || suitOf(a) === "z") return null;
  const ranks = [rankOf(a), rankOf(b), rankOf(win)].sort((left, right) => left - right);
  if (ranks[0] + 1 !== ranks[1] || ranks[1] + 1 !== ranks[2]) return null;
  const winRank = rankOf(win);
  if (winRank !== ranks[0] && winRank !== ranks[2]) return "kanchan";
  const other = winRank === ranks[0] ? ranks[2] + 1 : ranks[0] - 1;
  return other >= 1 && other <= 9 ? "ryanmen" : "penchan";
}

function exactMelds(counts: readonly number[], need: number): boolean {
  const tiles = counts.slice();
  return consume(tiles, need);
}

function consume(counts: number[], need: number): boolean {
  if (need === 0) return counts.every((n) => n === 0);
  let tile = 0;
  while (tile < 34 && counts[tile] === 0) tile += 1;
  if (tile >= 34) return false;
  if (counts[tile] >= 3) {
    counts[tile] -= 3;
    if (consume(counts, need - 1)) return true;
    counts[tile] += 3;
  }
  if (tile < 27 && rankOf(tile) <= 7 && counts[tile + 1] > 0 && counts[tile + 2] > 0) {
    counts[tile] -= 1;
    counts[tile + 1] -= 1;
    counts[tile + 2] -= 1;
    if (consume(counts, need - 1)) return true;
    counts[tile] += 1;
    counts[tile + 1] += 1;
    counts[tile + 2] += 1;
  }
  return false;
}
