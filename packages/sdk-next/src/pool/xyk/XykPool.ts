import {
  BuyCtx,
  Pool,
  PoolBase,
  PoolError,
  PoolFee,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellCtx,
} from '../types';
import { RUNTIME_DECIMALS } from '../../consts';
import { fmt } from '../../utils';

import { XykMath } from './XykMath';

export type XykPoolFees = PoolFees & {
  exchangeFee: PoolFee;
};

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;

  static fromPool(pool: PoolBase): XykPool {
    return new XykPool(
      pool.address,
      pool.tokens as PoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit
    );
  }

  constructor(
    address: string,
    tokens: PoolToken[],
    maxInRation: bigint,
    maxOutRatio: bigint,
    minTradeLimit: bigint
  ) {
    this.type = PoolType.XYK;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
  }

  validatePair(_tokenIn: number, _tokenOut: number): boolean {
    return true;
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

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: bigint,
    fees: XykPoolFees
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);

    const fee = this.calculateTradeFee(calculatedIn, fees);
    const feePct = fmt.toPct(fees.exchangeFee);
    const amountIn = calculatedIn + fee;

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
      amountIn: amountIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as BuyCtx;
  }

  validateAndSell(
    poolPair: PoolPair,
    amountIn: bigint,
    fees: XykPoolFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);

    const fee = this.calculateTradeFee(calculatedOut, fees);
    const feePct = fmt.toPct(fees.exchangeFee);
    const amountOut = calculatedOut - fee;

    const errors: PoolError[] = [];

    if (
      amountIn < this.minTradingLimit ||
      calculatedOut < poolPair.assetOutEd
    ) {
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
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as SellCtx;
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: bigint): bigint {
    const result = XykMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toString()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: bigint): bigint {
    const result = XykMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountIn.toString()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  spotPriceInGivenOut(poolPair: PoolPair): bigint {
    const spot = XykMath.calculateSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsOut);
    return BigInt(spot) / BigInt(base);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): bigint {
    const spot = XykMath.calculateSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsIn);
    return BigInt(spot) / BigInt(base);
  }

  calculateTradeFee(amount: bigint, fees: XykPoolFees): bigint {
    const fee = XykMath.calculatePoolTradeFee(
      amount.toString(),
      fees.exchangeFee[0],
      fees.exchangeFee[1]
    );
    return BigInt(fee);
  }
}
