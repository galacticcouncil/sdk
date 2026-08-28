import JSBI from 'jsbi';
import {
  SwapMath,
  TickMath,
  nearestUsableTick as refNearestUsableTick,
} from '@uniswap/v3-sdk';

import { computeSwapStep } from './swapMath';
import {
  MAX_TICK,
  MIN_TICK,
  getSqrtRatioAtTick,
  getTickAtSqrtRatio,
  nearestUsableTick,
} from './tickMath';

/**
 * `getSqrtRatioAtTick` picks from 20 constants by tick bit, so a mistyped digit
 * is invisible unless that bit is set. The tick set exercises every bit alone
 * and with a neighbour, plus a seeded sweep.
 */

const toBig = (x: JSBI): bigint => BigInt(x.toString());
const toJsbi = (x: bigint): JSBI => JSBI.BigInt(x.toString());

/** Seeded LCG, so a failure is always reproducible */
function random(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

const rnd = random(0x2f6e2b1);
const randInt = (lo: number, hi: number) =>
  lo + Math.floor(rnd() * (hi - lo + 1));

const TICKS: number[] = (() => {
  const set = new Set<number>([MIN_TICK, MAX_TICK, 0, 1, -1]);
  for (let bit = 1; bit <= MAX_TICK; bit <<= 1) {
    set.add(bit);
    set.add(-bit);
    set.add(bit + 1);
    set.add(-(bit + 1));
  }
  for (let i = 0; i < 500; i++) set.add(randInt(MIN_TICK, MAX_TICK));
  return [...set];
})();

describe('tick math vs @uniswap/v3-sdk reference', () => {
  it('reproduces getSqrtRatioAtTick on every constant-selecting bit', () => {
    for (const tick of TICKS) {
      expect(`${tick}:${getSqrtRatioAtTick(tick)}`).toBe(
        `${tick}:${toBig(TickMath.getSqrtRatioAtTick(tick))}`
      );
    }
  });

  it('reproduces getTickAtSqrtRatio, including one wei above each tick', () => {
    const min = toBig(TickMath.MIN_SQRT_RATIO);
    const max = toBig(TickMath.MAX_SQRT_RATIO);

    for (const tick of TICKS) {
      if (tick >= MAX_TICK) continue;
      const sqrt = getSqrtRatioAtTick(tick);
      for (const probe of [sqrt, sqrt + 1n]) {
        if (probe < min || probe >= max) continue;
        expect(`${probe}:${getTickAtSqrtRatio(probe)}`).toBe(
          `${probe}:${TickMath.getTickAtSqrtRatio(toJsbi(probe))}`
        );
      }
    }
  });

  it('reproduces nearestUsableTick across every enabled spacing', () => {
    for (const spacing of [1, 4, 6, 8, 10, 60, 200]) {
      for (let i = 0; i < 200; i++) {
        const tick = randInt(MIN_TICK, MAX_TICK);
        expect(`${tick}/${spacing}:${nearestUsableTick(tick, spacing)}`).toBe(
          `${tick}/${spacing}:${refNearestUsableTick(tick, spacing)}`
        );
      }
    }
  });

  it('reproduces computeSwapStep in both directions, exact-in and exact-out', () => {
    let cases = 0;

    for (let i = 0; i < 2000; i++) {
      const tickCurrent = randInt(-200_000, 200_000);
      const tickTarget = tickCurrent + randInt(-5_000, 5_000);
      if (tickTarget <= MIN_TICK || tickTarget >= MAX_TICK) continue;

      const current = getSqrtRatioAtTick(tickCurrent);
      const target = getSqrtRatioAtTick(tickTarget);
      const liquidity =
        BigInt(randInt(0, 1_000_000)) * 10n ** BigInt(randInt(0, 12));
      const sign = rnd() < 0.5 ? 1n : -1n;
      const remaining =
        sign * BigInt(randInt(0, 1_000_000)) * 10n ** BigInt(randInt(0, 12));
      const fee = [0, 100, 500, 3000, 10000][randInt(0, 4)];

      const label = `cur=${tickCurrent} tgt=${tickTarget} L=${liquidity} amt=${remaining} fee=${fee}`;

      const actual = computeSwapStep(
        current,
        target,
        liquidity,
        remaining,
        fee
      );
      const expected = SwapMath.computeSwapStep(
        toJsbi(current),
        toJsbi(target),
        toJsbi(liquidity),
        toJsbi(remaining),
        fee
      ).map(toBig);

      expect(`${label} -> ${actual.join(',')}`).toBe(
        `${label} -> ${expected.join(',')}`
      );
      cases++;
    }

    expect(cases).toBeGreaterThan(1_500);
  });
});
