/**
 * Tick <-> sqrt-price conversion, in native `bigint`.
 *
 * - Ports Uniswap's `TickMath`; the constant ladder is the on-chain one
 * - Q64.96 fixed point throughout, matching the pool contract
 */

const Q32 = 1n << 32n;
const MAX_UINT256 = (1n << 256n) - 1n;

/** The lowest tick any pool can use */
export const MIN_TICK = -887272;

/** The highest tick any pool can use */
export const MAX_TICK = -MIN_TICK;

/** sqrt ratio at {@link MIN_TICK} */
export const MIN_SQRT_RATIO = 4295128739n;

/** sqrt ratio at {@link MAX_TICK} */
export const MAX_SQRT_RATIO =
  1461446703485210103287273052203988822378723970342n;

const mulShift = (val: bigint, mulBy: bigint): bigint => (val * mulBy) >> 128n;

/**
 * The sqrt ratio as a Q64.96 for a tick, i.e. `sqrt(1.0001)^tick`.
 *
 * @param tick - the tick to convert
 */
export function getSqrtRatioAtTick(tick: number): bigint {
  if (!Number.isInteger(tick) || tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error(`tick out of range: ${tick}`);
  }

  const absTick = tick < 0 ? -tick : tick;

  let ratio =
    (absTick & 0x1) !== 0
      ? 0xfffcb933bd6fad37aa2d162d1a594001n
      : 0x100000000000000000000000000000000n;

  if ((absTick & 0x2) !== 0)
    ratio = mulShift(ratio, 0xfff97272373d413259a46990580e213an);
  if ((absTick & 0x4) !== 0)
    ratio = mulShift(ratio, 0xfff2e50f5f656932ef12357cf3c7fdccn);
  if ((absTick & 0x8) !== 0)
    ratio = mulShift(ratio, 0xffe5caca7e10e4e61c3624eaa0941cd0n);
  if ((absTick & 0x10) !== 0)
    ratio = mulShift(ratio, 0xffcb9843d60f6159c9db58835c926644n);
  if ((absTick & 0x20) !== 0)
    ratio = mulShift(ratio, 0xff973b41fa98c081472e6896dfb254c0n);
  if ((absTick & 0x40) !== 0)
    ratio = mulShift(ratio, 0xff2ea16466c96a3843ec78b326b52861n);
  if ((absTick & 0x80) !== 0)
    ratio = mulShift(ratio, 0xfe5dee046a99a2a811c461f1969c3053n);
  if ((absTick & 0x100) !== 0)
    ratio = mulShift(ratio, 0xfcbe86c7900a88aedcffc83b479aa3a4n);
  if ((absTick & 0x200) !== 0)
    ratio = mulShift(ratio, 0xf987a7253ac413176f2b074cf7815e54n);
  if ((absTick & 0x400) !== 0)
    ratio = mulShift(ratio, 0xf3392b0822b70005940c7a398e4b70f3n);
  if ((absTick & 0x800) !== 0)
    ratio = mulShift(ratio, 0xe7159475a2c29b7443b29c7fa6e889d9n);
  if ((absTick & 0x1000) !== 0)
    ratio = mulShift(ratio, 0xd097f3bdfd2022b8845ad8f792aa5825n);
  if ((absTick & 0x2000) !== 0)
    ratio = mulShift(ratio, 0xa9f746462d870fdf8a65dc1f90e061e5n);
  if ((absTick & 0x4000) !== 0)
    ratio = mulShift(ratio, 0x70d869a156d2a1b890bb3df62baf32f7n);
  if ((absTick & 0x8000) !== 0)
    ratio = mulShift(ratio, 0x31be135f97d08fd981231505542fcfa6n);
  if ((absTick & 0x10000) !== 0)
    ratio = mulShift(ratio, 0x9aa508b5b7a84e1c677de54f3e99bc9n);
  if ((absTick & 0x20000) !== 0)
    ratio = mulShift(ratio, 0x5d6af8dedb81196699c329225ee604n);
  if ((absTick & 0x40000) !== 0)
    ratio = mulShift(ratio, 0x2216e584f5fa1ea926041bedfe98n);
  if ((absTick & 0x80000) !== 0)
    ratio = mulShift(ratio, 0x48a170391f7dc42444e8fa2n);

  if (tick > 0) ratio = MAX_UINT256 / ratio;

  // Q128.128 -> Q64.96, rounding up
  return ratio % Q32 > 0n ? ratio / Q32 + 1n : ratio / Q32;
}

const POWERS_OF_2: [number, bigint][] = [128, 64, 32, 16, 8, 4, 2, 1].map(
  (pow) => [pow, 1n << BigInt(pow)]
);

/** Index of the highest set bit */
function mostSignificantBit(x: bigint): number {
  if (x <= 0n) throw new Error('mostSignificantBit: zero');
  if (x > MAX_UINT256) throw new Error('mostSignificantBit: overflow');

  let msb = 0;
  for (const [power, min] of POWERS_OF_2) {
    if (x >= min) {
      x >>= BigInt(power);
      msb += power;
    }
  }
  return msb;
}

/**
 * The greatest tick whose sqrt ratio does not exceed `sqrtRatioX96`.
 *
 * - Binary log of the ratio, then a scale into tick space
 *
 * @param sqrtRatioX96 - the Q64.96 sqrt ratio to convert
 */
export function getTickAtSqrtRatio(sqrtRatioX96: bigint): number {
  if (sqrtRatioX96 < MIN_SQRT_RATIO || sqrtRatioX96 >= MAX_SQRT_RATIO) {
    throw new Error(`sqrt ratio out of range: ${sqrtRatioX96}`);
  }

  const sqrtRatioX128 = sqrtRatioX96 << 32n;
  const msb = mostSignificantBit(sqrtRatioX128);

  let r =
    msb >= 128
      ? sqrtRatioX128 >> BigInt(msb - 127)
      : sqrtRatioX128 << BigInt(127 - msb);

  let log2 = (BigInt(msb) - 128n) << 64n;

  for (let i = 0; i < 14; i++) {
    r = (r * r) >> 127n;
    const f = r >> 128n;
    log2 |= f << BigInt(63 - i);
    r >>= f;
  }

  const logSqrt10001 = log2 * 255738958999603826347141n;

  const tickLow = Number(
    (logSqrt10001 - 3402992956809132418596140100660247210n) >> 128n
  );
  const tickHigh = Number(
    (logSqrt10001 + 291339464771989622907027621153398088495n) >> 128n
  );

  if (tickLow === tickHigh) return tickLow;
  return getSqrtRatioAtTick(tickHigh) <= sqrtRatioX96 ? tickHigh : tickLow;
}

/**
 * The closest tick to `tick` that a pool of this spacing can hold.
 *
 * @param tick - the target tick
 * @param tickSpacing - the pool's tick spacing
 */
export function nearestUsableTick(tick: number, tickSpacing: number): number {
  if (!Number.isInteger(tick) || !Number.isInteger(tickSpacing)) {
    throw new Error('nearestUsableTick: non-integer input');
  }
  if (tickSpacing <= 0) throw new Error('nearestUsableTick: tick spacing');
  if (tick < MIN_TICK || tick > MAX_TICK) {
    throw new Error(`tick out of range: ${tick}`);
  }

  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < MIN_TICK) return rounded + tickSpacing;
  if (rounded > MAX_TICK) return rounded - tickSpacing;
  return rounded;
}
