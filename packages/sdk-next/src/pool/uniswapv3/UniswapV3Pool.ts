import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

import {
  BuyCtx,
  Pool,
  PoolError,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellCtx,
} from '../types';
import { math } from '../../utils';

import { UniswapV3Math } from './UniswapV3Math';
import {
  UniswapV3PoolBase,
  UniswapV3PoolFees,
  V3PoolState,
  V3Tick,
} from './types';

const FEE_DENOMINATOR = 1_000_000;
const SPOT_SCALE = 10n ** BigInt(RUNTIME_DECIMALS);
const Q192 = 192n;

/**
 * Concrete Uniswap v3 pool. Implements the synchronous router `Pool` interface
 * by delegating swap math to `UniswapV3Math` (a tick-walk over the pool's
 * loaded concentrated liquidity) and deriving the spot price from `sqrtPriceX96`.
 *
 * The v3 fee is taken inside the swap, so — mirroring `OmniPool`/`StableSwap` —
 * `calculate*` returns the gross (fee-less) amount when called without `fees`
 * and the net amount when called with them; `validateAndSell/Buy` use the two
 * to report the effective fee.
 */
export class UniswapV3Pool implements Pool {
  type: PoolType;
  address: string;
  id?: number;
  tokens: PoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;

  fee: number;
  token0: number;
  token1: number;
  sqrtPriceX96: bigint;
  tick: number;
  liquidity: bigint;
  tickSpacing: number;
  ticks: V3Tick[];

  static fromPool(pool: UniswapV3PoolBase): UniswapV3Pool {
    return new UniswapV3Pool(pool);
  }

  constructor(pool: UniswapV3PoolBase) {
    this.type = PoolType.V3;
    this.address = pool.address;
    this.id = pool.id;
    this.tokens = pool.tokens;
    this.maxInRatio = pool.maxInRatio;
    this.maxOutRatio = pool.maxOutRatio;
    this.minTradingLimit = pool.minTradingLimit;
    this.fee = pool.fee;
    this.token0 = pool.token0;
    this.token1 = pool.token1;
    this.sqrtPriceX96 = pool.sqrtPriceX96;
    this.tick = pool.tick;
    this.liquidity = pool.liquidity;
    this.tickSpacing = pool.tickSpacing;
    this.ticks = pool.ticks;
  }

  validatePair(tokenIn: number, tokenOut: number): boolean {
    const contains = (t: number) => t === this.token0 || t === this.token1;
    return contains(tokenIn) && contains(tokenOut) && tokenIn !== tokenOut;
  }

  parsePair(tokenIn: number, tokenOut: number): PoolPair {
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error('Pool does not contain tokenIn');
    if (tokenOutMeta == null) throw new Error('Pool does not contain tokenOut');

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: tokenInMeta.balance,
      balanceOut: tokenOutMeta.balance,
      assetInEd: tokenInMeta.existentialDeposit,
      assetOutEd: tokenOutMeta.existentialDeposit,
    } as PoolPair;
  }

  /** Input required for `amountOut`; gross (fee-less) unless `fees` is given. */
  calculateInGivenOut(
    poolPair: PoolPair,
    amountOut: bigint,
    fees?: UniswapV3PoolFees
  ): bigint {
    return UniswapV3Math.calculateInGivenOut(
      this.toState(fees != null),
      this.isZeroForOne(poolPair.assetIn),
      amountOut
    );
  }

  /** Output for `amountIn`; gross (fee-less) unless `fees` is given. */
  calculateOutGivenIn(
    poolPair: PoolPair,
    amountIn: bigint,
    fees?: UniswapV3PoolFees
  ): bigint {
    return UniswapV3Math.calculateOutGivenIn(
      this.toState(fees != null),
      this.isZeroForOne(poolPair.assetIn),
      amountIn
    );
  }

  spotPriceOutGivenIn(poolPair: PoolPair): bigint {
    const spot = this.spotOutPerIn(this.isZeroForOne(poolPair.assetIn));
    return this.normalizeSpot(spot, poolPair.decimalsIn, poolPair.decimalsOut);
  }

  spotPriceInGivenOut(poolPair: PoolPair): bigint {
    const spot = this.spotOutPerIn(!this.isZeroForOne(poolPair.assetIn));
    return this.normalizeSpot(spot, poolPair.decimalsOut, poolPair.decimalsIn);
  }

  validateAndSell(
    poolPair: PoolPair,
    amountIn: bigint,
    _dynamicFees: PoolFees | null
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, this.fees());
    const feePct = math.calculateSellFee(calculatedOut, amountOut);

    const errors: PoolError[] = [];

    if (amountIn < this.minTradingLimit || calculatedOut < poolPair.assetOutEd) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolInReserve = poolPair.balanceIn / this.maxInRatio;
    if (amountIn > poolInReserve) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    const poolOutReserve = poolPair.balanceOut / this.maxOutRatio;
    if (amountOut > poolOutReserve) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    return {
      amountIn,
      calculatedOut,
      amountOut,
      feePct,
      errors,
    } as SellCtx;
  }

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: bigint,
    _dynamicFees: PoolFees | null
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, this.fees());
    const feePct = math.calculateBuyFee(calculatedIn, amountIn);

    const errors: PoolError[] = [];

    if (amountOut < this.minTradingLimit || calculatedIn < poolPair.assetInEd) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolOutReserve = poolPair.balanceOut / this.maxOutRatio;
    if (amountOut > poolOutReserve) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    const poolInReserve = poolPair.balanceIn / this.maxInRatio;
    if (amountIn > poolInReserve) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    return {
      amountIn,
      calculatedIn,
      amountOut,
      feePct,
      errors,
    } as BuyCtx;
  }

  private fees(): UniswapV3PoolFees {
    return { fee: [this.fee, FEE_DENOMINATOR] } as UniswapV3PoolFees;
  }

  private isZeroForOne(assetIn: number): boolean {
    return assetIn === this.token0;
  }

  private toState(applyFee: boolean): V3PoolState {
    return {
      fee: applyFee ? this.fee : 0,
      sqrtPriceX96: this.sqrtPriceX96,
      tick: this.tick,
      liquidity: this.liquidity,
      tickSpacing: this.tickSpacing,
      ticks: this.ticks,
    };
  }

  private spotOutPerIn(zeroForOne: boolean): bigint {
    const sq = this.sqrtPriceX96 * this.sqrtPriceX96;
    if (sq === 0n) return 0n;
    const price1Per0 = (sq * SPOT_SCALE) >> Q192;
    if (zeroForOne) return price1Per0;
    return (SPOT_SCALE << Q192) / sq;
  }

  private normalizeSpot(
    spot: bigint,
    decimalsIn: number,
    decimalsOut: number
  ): bigint {
    const diff = decimalsIn - decimalsOut;
    if (diff === 0) return spot;
    const factor = 10n ** BigInt(Math.abs(diff));
    return diff > 0 ? spot * factor : spot / factor;
  }
}
