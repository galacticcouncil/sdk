import {
  BuyTransfer,
  Pool,
  PoolBase,
  PoolError,
  PoolFee,
  PoolPair,
  PoolToken,
  PoolType,
  SellTransfer,
} from '../../types';
import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';
import { toPct } from '../../utils/mapper';

import { XykMath } from './XykMath';

export type XykPoolBase = PoolBase & {
  exchangeFee: PoolFee;
};

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  exchangeFee: PoolFee;

  static fromPool(pool: XykPoolBase): XykPool {
    return new XykPool(
      pool.address,
      pool.tokens,
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.exchangeFee
    );
  }

  constructor(
    address: string,
    tokens: PoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    exchangeFee: PoolFee
  ) {
    this.type = PoolType.XYK;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.exchangeFee = exchangeFee;
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

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as PoolPair;
  }

  validateAndBuy(poolPair: PoolPair, amountOut: BigNumber): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const fee = this.calculateTradeFee(calculatedIn);
    const amountIn = calculatedIn.plus(fee);
    const feePct = toPct(this.exchangeFee);

    const errors: PoolError[] = [];

    if (amountOut.isLessThan(this.minTradingLimit)) {
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
    } as BuyTransfer;
  }

  validateAndSell(poolPair: PoolPair, amountIn: BigNumber): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const fee = this.calculateTradeFee(calculatedOut);
    const amountOut = calculatedOut.minus(fee);
    const feePct = toPct(this.exchangeFee);

    const errors: PoolError[] = [];

    if (amountIn.isLessThan(this.minTradingLimit)) {
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
    } as SellTransfer;
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
    const price = XykMath.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      scale(ONE, poolPair.decimalsOut).toString()
    );
    return bnum(price);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const price = XykMath.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      scale(ONE, poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = XykMath.calculatePoolTradeFee(amount.toString(), this.exchangeFee[0], this.exchangeFee[1]);
    return bnum(fee);
  }
}
