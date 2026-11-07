/** Standard 34-tile set. Ids 0–8 man, 9–17 pin, 18–26 sou, then honors. */

export const TILE_KINDS = 34;

export type Wind = "east" | "south" | "west" | "north";

export const EAST = 27;
export const SOUTH = 28;
export const WEST = 29;
export const NORTH = 30;
export const HAKU = 31;
export const HATSU = 32;
export const CHUN = 33;

export const WIND_TILE: Record<Wind, number> = {
  east: EAST,
  south: SOUTH,
  west: WEST,
  north: NORTH,
};

export const WINDS: readonly Wind[] = ["east", "south", "west", "north"];

export const WIND_NAME: Record<Wind, string> = {
  east: "восток",
  south: "юг",
  west: "запад",
  north: "север",
};

const HONOR_NAME = ["восток", "юг", "запад", "север", "белый", "зелёный", "красный"];
const HONOR_MARK = ["東", "南", "西", "北", "白", "發", "中"];

export function suitOf(id: number): "m" | "p" | "s" | "z" {
  if (id < 9) return "m";
  if (id < 18) return "p";
  if (id < 27) return "s";
  return "z";
}

/** 1–9 for a suit, 1–7 for honors (east … red). */
export function rankOf(id: number): number {
  if (id < 27) return (id % 9) + 1;
  return id - 26;
}

export function isHonor(id: number): boolean {
  return id >= 27;
}

export function isTerminal(id: number): boolean {
  return id < 27 && (id % 9 === 0 || id % 9 === 8);
}

export function isTerminalOrHonor(id: number): boolean {
  return isHonor(id) || isTerminal(id);
}

export function isSimple(id: number): boolean {
  return id < 27 && id % 9 > 0 && id % 9 < 8;
}

export function isDragon(id: number): boolean {
  return id >= HAKU && id <= CHUN;
}

export function windOfTile(id: number): Wind | null {
  if (id === EAST) return "east";
  if (id === SOUTH) return "south";
  if (id === WEST) return "west";
  if (id === NORTH) return "north";
  return null;
}

export function tileLabel(id: number): string {
  const suit = suitOf(id);
  if (suit === "z") return HONOR_NAME[id - 27] ?? "";
  const rank = rankOf(id);
  if (suit === "m") return `${rank} ман`;
  if (suit === "p") return `${rank} пин`;
  return `${rank} соу`;
}

export function honorMark(id: number): string {
  return HONOR_MARK[id - 27] ?? "";
}

export function emptyCounts(): number[] {
  return Array.from({ length: TILE_KINDS }, () => 0);
}

export function countsFromTiles(tiles: readonly number[]): number[] {
  const counts = emptyCounts();
  for (const id of tiles) counts[id] += 1;
  return counts;
}

/** Groups like `234m55p111z`. Honors are 1–7: east, south, west, north, white, green, red. */
export function parseNotation(text: string): number[] {
  const counts = emptyCounts();
  const pattern = /(\d+)([mpsz])/g;
  for (const match of text.matchAll(pattern)) {
    const suit = match[2];
    for (const digit of match[1]) {
      const n = Number(digit);
      if (suit === "m") counts[n - 1] += 1;
      else if (suit === "p") counts[9 + n - 1] += 1;
      else if (suit === "s") counts[18 + n - 1] += 1;
      else counts[26 + n] += 1;
    }
  }
  return counts;
}

export function tileTotal(counts: readonly number[]): number {
  return counts.reduce((sum, n) => sum + n, 0);
}
