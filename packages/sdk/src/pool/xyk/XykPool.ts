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

import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import { XykMath } from './XykMath';

export type XykPoolFees = PoolFees & {
  exchangeFee: PoolFee;
};

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;

  static fromPool(pool: PoolBase): XykPool {
    return new XykPool(pool);
  }

  constructor(pool: PoolBase) {
    this.type = PoolType.XYK;
    this.address = pool.address;
    this.tokens = pool.tokens;
    this.maxInRatio = pool.maxInRatio;
    this.maxOutRatio = pool.maxOutRatio;
    this.minTradingLimit = pool.minTradingLimit;
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): PoolPair {
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error('Pool does not contain tokenIn');
    if (tokenOutMeta == null) throw new Error('Pool does not contain tokenOut');

    const balanceIn = bnum(tokenInMeta.balance);
    const balanceOut = bnum(tokenOutMeta.balance);

    const assetInED = bnum(tokenInMeta.existentialDeposit);
    const assetOutED = bnum(tokenOutMeta.existentialDeposit);

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
      assetInED,
      assetOutED,
    } as PoolPair;
  }

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees: XykPoolFees
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);

    const fee = this.calculateTradeFee(calculatedIn, fees);
    const feePct = FeeUtils.toPct(fees.exchangeFee);
    const amountIn = calculatedIn.plus(fee);

    const errors: PoolError[] = [];

    if (
      amountOut.isLessThan(this.minTradingLimit) ||
      calculatedIn.isLessThan(poolPair.assetInED)
    ) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolOutReserve = poolPair.balanceOut.div(this.maxOutRatio);
    if (amountOut.isGreaterThan(poolOutReserve)) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    const poolInReserve = poolPair.balanceIn.div(this.maxInRatio);
    if (amountIn.isGreaterThan(poolInReserve)) {
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
    amountIn: BigNumber,
    fees: XykPoolFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);

    const fee = this.calculateTradeFee(calculatedOut, fees);
    const feePct = FeeUtils.toPct(fees.exchangeFee);
    const amountOut = calculatedOut.minus(fee);

    const errors: PoolError[] = [];

    if (
      amountIn.isLessThan(this.minTradingLimit) ||
      calculatedOut.isLessThan(poolPair.assetOutED)
    ) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolInReserve = poolPair.balanceIn.div(this.maxInRatio);
    if (amountIn.isGreaterThan(poolInReserve)) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    const poolOutReserve = poolPair.balanceOut.div(this.maxOutRatio);
    if (amountOut.isGreaterThan(poolOutReserve)) {
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

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    const price = XykMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toFixed(0)
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    const price = XykMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountIn.toFixed(0)
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    const price = XykMath.calculateSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString()
    );

    const base = scale(ONE, 18 - poolPair.decimalsOut);
    return bnum(price).div(base);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const price = XykMath.calculateSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString()
    );

    const base = scale(ONE, 18 - poolPair.decimalsIn);
    return bnum(price).div(base);
  }

  calculateTradeFee(amount: BigNumber, fees: XykPoolFees): BigNumber {
    const fee = XykMath.calculatePoolTradeFee(
      amount.toString(),
      fees.exchangeFee[0],
      fees.exchangeFee[1]
    );
    return bnum(fee);
  }
}
