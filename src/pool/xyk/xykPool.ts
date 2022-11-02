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
import { BigNumber, bnum, ONE, scale } from '../../utils/bignumber';
import { toPct } from '../../utils/mapper';
import math from './xykMath';

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  tradeFee: PoolFee;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;

  static fromPool(pool: PoolBase): XykPool {
    return new XykPool(
      pool.address,
      pool.tradeFee,
      pool.tokens,
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit
    );
  }

  constructor(
    address: string,
    swapFee: PoolFee,
    tokens: PoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number
  ) {
    this.type = PoolType.XYK;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
  }

  validPair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePoolPair(tokenIn: string, tokenOut: string): PoolPair {
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

  validateBuy(poolPair: PoolPair, amountOut: BigNumber): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const fee = this.calculateTradeFee(calculatedIn);
    const amountIn = calculatedIn.plus(fee);
    const feePct = toPct(this.tradeFee);

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

  validateSell(poolPair: PoolPair, amountIn: BigNumber): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const fee = this.calculateTradeFee(calculatedOut);
    const amountOut = calculatedOut.minus(fee);
    const feePct = toPct(this.tradeFee);

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
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toString()
    );
    return bnum(price);
  }

  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    const price = math.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountIn.toString()
    );
    return bnum(price);
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      scale(ONE, poolPair.decimalsOut).toString()
    );
    return bnum(price);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      scale(ONE, poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = math.calculatePoolTradeFee(amount.toString(), this.tradeFee[0], this.tradeFee[1]);
    return bnum(fee);
  }
}
