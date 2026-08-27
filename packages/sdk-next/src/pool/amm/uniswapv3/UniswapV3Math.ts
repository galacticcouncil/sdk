import { V3PoolState, V3Tick } from './types';
import {
  MAX_SQRT_RATIO,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MIN_TICK,
  computeSwapStep,
  getSqrtRatioAtTick,
  getTick,
  getTickAtSqrtRatio,
  nextInitializedTickWithinOneWord,
} from './math';

type SwapResult = {
  amountCalculated: bigint;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
  /**
   * Whether the requested amount was fully consumed.
   *
   * The walk stops for two different reasons: the order filled, or the pool ran
   * out of liquidity in that direction and the price reached its limit. Only the
   * first is a usable quote.
   */
  filled: boolean;
};

export class UniswapV3Math {
  static calculateOutGivenIn(
    state: V3PoolState,
    zeroForOne: boolean,
    amountIn: bigint
  ): bigint {
    if (amountIn <= 0n) return 0n;
    const result = UniswapV3Math.computeSwap(state, zeroForOne, amountIn);
    // Exact-in is a best-effort sell: an input the pool cannot fully absorb still
    // yields whatever it bought, which is what the chain would do too.
    return -result.amountCalculated;
  }

  static calculateInGivenOut(
    state: V3PoolState,
    zeroForOne: boolean,
    amountOut: bigint
  ): bigint {
    if (amountOut <= 0n) return 0n;
    const result = UniswapV3Math.computeSwap(state, zeroForOne, -amountOut);
    // A partial fill is not a cheap quote, it is a trade that reverts on-chain:
    // the router would compare an input priced for less than `amountOut` against
    // venues that can actually deliver it, pick this one, and fail at execution.
    if (!result.filled) return 0n;
    return result.amountCalculated;
  }

  private static computeSwap(
    state: V3PoolState,
    zeroForOne: boolean,
    amountSpecified: bigint
  ): SwapResult {
    const ticks = UniswapV3Math.sortTicks(state.ticks);
    const tickSpacing = state.tickSpacing;
    const fee = state.fee;

    const sqrtPriceLimitX96 = zeroForOne
      ? MIN_SQRT_RATIO + 1n
      : MAX_SQRT_RATIO - 1n;

    const exactInput = amountSpecified >= 0n;

    let amountSpecifiedRemaining = amountSpecified;
    let amountCalculated = 0n;
    let sqrtPriceX96 = state.sqrtPriceX96;
    let tick = state.tick;
    let liquidity = state.liquidity;

    while (
      amountSpecifiedRemaining !== 0n &&
      sqrtPriceX96 !== sqrtPriceLimitX96
    ) {
      const sqrtPriceStartX96 = sqrtPriceX96;

      let [tickNext, initialized] = nextInitializedTickWithinOneWord(
        ticks,
        tick,
        zeroForOne,
        tickSpacing
      );

      if (tickNext < MIN_TICK) tickNext = MIN_TICK;
      else if (tickNext > MAX_TICK) tickNext = MAX_TICK;

      const sqrtPriceNextX96 = getSqrtRatioAtTick(tickNext);

      const sqrtPriceTargetX96 = (
        zeroForOne
          ? sqrtPriceNextX96 < sqrtPriceLimitX96
          : sqrtPriceNextX96 > sqrtPriceLimitX96
      )
        ? sqrtPriceLimitX96
        : sqrtPriceNextX96;

      const [nextSqrtPriceX96, amountInStep, amountOutStep, feeStep] =
        computeSwapStep(
          sqrtPriceX96,
          sqrtPriceTargetX96,
          liquidity,
          amountSpecifiedRemaining,
          fee
        );

      sqrtPriceX96 = nextSqrtPriceX96;

      if (exactInput) {
        amountSpecifiedRemaining -= amountInStep + feeStep;
        amountCalculated -= amountOutStep;
      } else {
        amountSpecifiedRemaining += amountOutStep;
        amountCalculated += amountInStep + feeStep;
      }

      if (sqrtPriceX96 === sqrtPriceNextX96) {
        if (initialized) {
          const liquidityNet = getTick(ticks, tickNext).liquidityNet;
          liquidity += zeroForOne ? -liquidityNet : liquidityNet;
        }
        tick = zeroForOne ? tickNext - 1 : tickNext;
      } else if (sqrtPriceX96 !== sqrtPriceStartX96) {
        tick = getTickAtSqrtRatio(sqrtPriceX96);
      }
    }

    return {
      amountCalculated,
      sqrtPriceX96,
      liquidity,
      tick,
      filled: amountSpecifiedRemaining === 0n,
    };
  }

  private static sortTicks(ticks: V3Tick[]): V3Tick[] {
    return [...ticks].sort((a, b) => a.index - b.index);
  }
}
