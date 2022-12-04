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
import { toPct, toPermill } from '../../utils/mapper';
import math from './omniMath';

export type OmniPoolPair = PoolPair & {
  hubReservesIn: BigNumber;
  hubReservesOut: BigNumber;
  sharesIn: BigNumber;
  sharesOut: BigNumber;
};

export type OmniPoolToken = PoolToken & {
  hubReserves: BigNumber;
  shares: BigNumber;
};

export class OmniPool implements Pool {
  type: PoolType;
  address: string;
  tradeFee: PoolFee;
  tokens: OmniPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  assetFee: PoolFee;
  protocolFee: PoolFee;

  static fromPool(pool: PoolBase): OmniPool {
    if (!pool.assetFee) throw new Error('OmniPool missing assetFee');
    if (!pool.protocolFee) throw new Error('OmniPool missing protocolFee');
    return new OmniPool(
      pool.address,
      pool.tradeFee,
      pool.tokens as OmniPoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.assetFee,
      pool.protocolFee
    );
  }

  constructor(
    address: string,
    swapFee: PoolFee,
    tokens: OmniPoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    assetFee: PoolFee,
    protocolFee: PoolFee
  ) {
    this.type = PoolType.Omni;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.assetFee = assetFee;
    this.protocolFee = protocolFee;
  }

  validPair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePoolPair(tokenIn: string, tokenOut: string): OmniPoolPair {
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
      hubReservesIn: tokenInMeta.hubReserves,
      hubReservesOut: tokenOutMeta.hubReserves,
      sharesIn: tokenInMeta.shares,
      sharesOut: tokenOutMeta.shares,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as OmniPoolPair;
  }

  validateBuy(poolPair: OmniPoolPair, amountOut: BigNumber): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut, false);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, true);

    const fee = amountIn.minus(calculatedIn);
    const feePct = fee.div(calculatedIn).multipliedBy(100).decimalPlaces(2);

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
      feePct: feePct.toNumber(),
      errors: errors,
    } as BuyTransfer;
  }

  validateSell(poolPair: OmniPoolPair, amountIn: BigNumber): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn, false);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, true);

    const fee = calculatedOut.minus(amountOut);
    const feePct = fee.div(calculatedOut).multipliedBy(100).decimalPlaces(2);

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
      feePct: feePct.toNumber(),
      errors: errors,
    } as SellTransfer;
  }

  calculateInGivenOut(poolPair: OmniPoolPair, amountOut: BigNumber, applyFee: boolean): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toString(),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString(),
      applyFee ? toPermill(this.protocolFee).toString() : ZERO.toString()
    );
    return bnum(price);
  }

  calculateOutGivenIn(poolPair: OmniPoolPair, amountIn: BigNumber, applyFee: boolean): BigNumber {
    const price = math.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toString(),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString(),
      applyFee ? toPermill(this.protocolFee).toString() : ZERO.toString()
    );
    return bnum(price);
  }

  spotPriceInGivenOut(poolPair: OmniPoolPair): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      scale(ONE, poolPair.decimalsOut).toString(),
      ZERO.toString(),
      ZERO.toString()
    );
    return bnum(price);
  }

  spotPriceOutGivenIn(poolPair: OmniPoolPair): BigNumber {
    const price = math.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      scale(ONE, poolPair.decimalsIn).toString(),
      ZERO.toString(),
      ZERO.toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    throw new Error('Not supported in OmniPool');
  }
}
