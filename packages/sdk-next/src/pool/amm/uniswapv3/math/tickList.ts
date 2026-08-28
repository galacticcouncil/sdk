/**
 * Navigation over a pool's loaded, ascending-sorted tick list.
 *
 * - Ports Uniswap's `TickList`, over this venue's own `V3Tick`
 * - "Within one word" mirrors the contract's bitmap stride, so the walk crosses
 *   the same boundaries the pool does
 */

import { V3Tick } from '../types';

const isBelowSmallest = (ticks: V3Tick[], tick: number): boolean =>
  tick < ticks[0].index;

const isAtOrAboveLargest = (ticks: V3Tick[], tick: number): boolean =>
  tick >= ticks[ticks.length - 1].index;

/** Index of the largest tick at or below `tick` */
function binarySearch(ticks: V3Tick[], tick: number): number {
  if (isBelowSmallest(ticks, tick)) {
    throw new Error(`tick ${tick} is below the loaded window`);
  }

  let l = 0;
  let r = ticks.length - 1;

  for (;;) {
    const i = Math.floor((l + r) / 2);
    const atOrBelow = ticks[i].index <= tick;
    if (atOrBelow && (i === ticks.length - 1 || ticks[i + 1].index > tick)) {
      return i;
    }
    if (ticks[i].index < tick) l = i + 1;
    else r = i - 1;
  }
}

/** The loaded tick at `index`; throws when it was never loaded */
export function getTick(ticks: V3Tick[], index: number): V3Tick {
  const tick = ticks[binarySearch(ticks, index)];
  if (tick.index !== index) {
    throw new Error(`tick ${index} is not in the loaded window`);
  }
  return tick;
}

function nextInitializedTick(
  ticks: V3Tick[],
  tick: number,
  lte: boolean
): V3Tick {
  if (lte) {
    if (isAtOrAboveLargest(ticks, tick)) return ticks[ticks.length - 1];
    return ticks[binarySearch(ticks, tick)];
  }
  if (isBelowSmallest(ticks, tick)) return ticks[0];
  return ticks[binarySearch(ticks, tick) + 1];
}

/**
 * The next tick the walk can reach, capped at the current bitmap word.
 *
 * - Returns `[tick, initialized]`; an uninitialized result is a word boundary,
 *   which the walk steps over without crossing liquidity
 *
 * @param ticks - loaded ticks, ascending
 * @param tick - the tick the walk is at
 * @param lte - true when trading token0 for token1 (price moving down)
 * @param tickSpacing - the pool's tick spacing
 */
export function nextInitializedTickWithinOneWord(
  ticks: V3Tick[],
  tick: number,
  lte: boolean,
  tickSpacing: number
): [number, boolean] {
  const compressed = Math.floor(tick / tickSpacing);

  if (lte) {
    const wordPos = compressed >> 8;
    const minimum = (wordPos << 8) * tickSpacing;

    if (isBelowSmallest(ticks, tick)) return [minimum, false];

    const index = nextInitializedTick(ticks, tick, lte).index;
    const next = Math.max(minimum, index);
    return [next, next === index];
  }

  const wordPos = (compressed + 1) >> 8;
  const maximum = (((wordPos + 1) << 8) - 1) * tickSpacing;

  if (isAtOrAboveLargest(ticks, tick)) return [maximum, false];

  const index = nextInitializedTick(ticks, tick, lte).index;
  const next = Math.min(maximum, index);
  return [next, next === index];
}
