import type { Wind } from "../tiles/tiles";

/** East is the dealer. South, West, and North are not. Round wind is not a dealer. */
export function isDealerSeat(seat: Wind): boolean {
  return seat === "east";
}
