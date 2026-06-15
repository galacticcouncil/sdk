import JSBI from 'jsbi';
import {
  FeeAmount,
  LiquidityMath,
  SwapMath,
  Tick,
  TickList,
  TickMath,
} from '@uniswap/v3-sdk';

import { V3PoolState, V3Tick } from './types';

const ZERO = JSBI.BigInt(0);
const ONE = JSBI.BigInt(1);
const NEGATIVE_ONE = JSBI.BigInt(-1);

type SwapResult = {
  amountCalculated: JSBI;
  sqrtPriceX96: JSBI;
  liquidity: JSBI;
  tick: number;
};

export class UniswapV3Math {
  static calculateOutGivenIn(
    state: V3PoolState,
    zeroForOne: boolean,
    amountIn: bigint
  ): bigint {
    if (amountIn <= 0n || state.liquidity <= 0n) return 0n;
    const result = UniswapV3Math.computeSwap(
      state,
      zeroForOne,
      JSBI.BigInt(amountIn.toString())
    );
    const out = JSBI.multiply(result.amountCalculated, NEGATIVE_ONE);
    return BigInt(out.toString());
  }

  static calculateInGivenOut(
    state: V3PoolState,
    zeroForOne: boolean,
    amountOut: bigint
  ): bigint {
    if (amountOut <= 0n || state.liquidity <= 0n) return 0n;
    const result = UniswapV3Math.computeSwap(
      state,
      zeroForOne,
      JSBI.multiply(JSBI.BigInt(amountOut.toString()), NEGATIVE_ONE)
    );
    return BigInt(result.amountCalculated.toString());
  }

  private static computeSwap(
    state: V3PoolState,
    zeroForOne: boolean,
    amountSpecified: JSBI
  ): SwapResult {
    const ticks = UniswapV3Math.buildTicks(state.ticks);
    const tickSpacing = state.tickSpacing;
    const fee = state.fee as FeeAmount;

    const sqrtPriceLimitX96 = zeroForOne
      ? JSBI.add(TickMath.MIN_SQRT_RATIO, ONE)
      : JSBI.subtract(TickMath.MAX_SQRT_RATIO, ONE);

    const exactInput = JSBI.greaterThanOrEqual(amountSpecified, ZERO);

    let amountSpecifiedRemaining = amountSpecified;
    let amountCalculated = ZERO;
    let sqrtPriceX96 = JSBI.BigInt(state.sqrtPriceX96.toString());
    let tick = state.tick;
    let liquidity = JSBI.BigInt(state.liquidity.toString());

    while (
      JSBI.notEqual(amountSpecifiedRemaining, ZERO) &&
      JSBI.notEqual(sqrtPriceX96, sqrtPriceLimitX96)
    ) {
      const sqrtPriceStartX96 = sqrtPriceX96;

      let [tickNext, initialized] = TickList.nextInitializedTickWithinOneWord(
        ticks,
        tick,
        zeroForOne,
        tickSpacing
      );

      if (tickNext < TickMath.MIN_TICK) tickNext = TickMath.MIN_TICK;
      else if (tickNext > TickMath.MAX_TICK) tickNext = TickMath.MAX_TICK;

      const sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(tickNext);

      const sqrtPriceTargetX96 = (
        zeroForOne
          ? JSBI.lessThan(sqrtPriceNextX96, sqrtPriceLimitX96)
          : JSBI.greaterThan(sqrtPriceNextX96, sqrtPriceLimitX96)
      )
        ? sqrtPriceLimitX96
        : sqrtPriceNextX96;

      const [nextSqrtPriceX96, amountInStep, amountOutStep, feeStep] =
        SwapMath.computeSwapStep(
          sqrtPriceX96,
          sqrtPriceTargetX96,
          liquidity,
          amountSpecifiedRemaining,
          fee
        );

      sqrtPriceX96 = nextSqrtPriceX96;

      if (exactInput) {
        amountSpecifiedRemaining = JSBI.subtract(
          amountSpecifiedRemaining,
          JSBI.add(amountInStep, feeStep)
        );
        amountCalculated = JSBI.subtract(amountCalculated, amountOutStep);
      } else {
        amountSpecifiedRemaining = JSBI.add(
          amountSpecifiedRemaining,
          amountOutStep
        );
        amountCalculated = JSBI.add(
          amountCalculated,
          JSBI.add(amountInStep, feeStep)
        );
      }

      if (JSBI.equal(sqrtPriceX96, sqrtPriceNextX96)) {
        if (initialized) {
          let liquidityNet = TickList.getTick(ticks, tickNext).liquidityNet;
          if (zeroForOne) {
            liquidityNet = JSBI.multiply(liquidityNet, NEGATIVE_ONE);
          }
          liquidity = LiquidityMath.addDelta(liquidity, liquidityNet);
        }
        tick = zeroForOne ? tickNext - 1 : tickNext;
      } else if (JSBI.notEqual(sqrtPriceX96, sqrtPriceStartX96)) {
        tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);
      }
    }

    return {
      amountCalculated,
      sqrtPriceX96,
      liquidity,
      tick,
    };
  }

  private static buildTicks(ticks: V3Tick[]): Tick[] {
    return ticks
      .map(
        (t) =>
          new Tick({
            index: t.index,
            liquidityGross: t.liquidityGross.toString(),
            liquidityNet: t.liquidityNet.toString(),
          })
      )
      .sort((a, b) => a.index - b.index);
  }
}
