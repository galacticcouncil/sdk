import { RUNTIME_DECIMALS } from '../../consts';
import { PoolConfigNotFound } from '../../errors';
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
import { BigNumber, bnum, ZERO } from '../../utils/bignumber';
import { toPermill } from '../../utils/mapper';

import { OmniMath } from './OmniMath';

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

export type OmniPoolBase = PoolBase & {
  assetFee: PoolFee;
  protocolFee: PoolFee;
  hubAssetId: string;
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
  hubAssetId: string;

  static fromPool(pool: OmniPoolBase): OmniPool {
    if (!pool.assetFee) throw new PoolConfigNotFound(PoolType.Omni, 'assetFee');
    if (!pool.protocolFee) throw new PoolConfigNotFound(PoolType.Omni, 'protocolFee');
    return new OmniPool(
      pool.address,
      pool.tradeFee,
      pool.tokens as OmniPoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.assetFee,
      pool.protocolFee,
      pool.hubAssetId
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
    protocolFee: PoolFee,
    hubAssetId: string
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
    this.hubAssetId = hubAssetId;
  }

  validPair(_tokenIn: string, tokenOut: string): boolean {
    // Buying LRNA not allowed
    if (this.hubAssetId == tokenOut) {
      return false;
    }
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
    const feePct = calculatedIn === ZERO ? ZERO : fee.div(calculatedIn).multipliedBy(100).decimalPlaces(2);

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
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateLrnaInGivenOut(poolPair, amountOut, applyFee);
    }

    const price = OmniMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toFixed(0),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString(),
      applyFee ? toPermill(this.protocolFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateLrnaInGivenOut(poolPair: OmniPoolPair, amountOut: BigNumber, applyFee: boolean): BigNumber {
    const price = OmniMath.calculateLrnaInGivenOut(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toFixed(0),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(poolPair: OmniPoolPair, amountIn: BigNumber, applyFee: boolean): BigNumber {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateOutGivenLrnaIn(poolPair, amountIn, applyFee);
    }

    const price = OmniMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toFixed(0),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString(),
      applyFee ? toPermill(this.protocolFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenLrnaIn(poolPair: OmniPoolPair, amountIn: BigNumber, applyFee: boolean): BigNumber {
    const price = OmniMath.calculateOutGivenLrnaIn(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toFixed(0),
      applyFee ? toPermill(this.assetFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  spotPriceInGivenOut(poolPair: OmniPoolPair): BigNumber {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.spotPriceLrnaInGivenOut(poolPair);
    }

    const price = OmniMath.calculateSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString()
    );
    return bnum(price)
      .shiftedBy(-1 * (RUNTIME_DECIMALS - poolPair.decimalsOut))
      .decimalPlaces(0, 1);
  }

  spotPriceLrnaInGivenOut(poolPair: OmniPoolPair): BigNumber {
    const price = OmniMath.calculateLrnaSpotPrice(poolPair.hubReservesOut.toString(), poolPair.balanceOut.toString());
    return bnum(price)
      .shiftedBy(-1 * (RUNTIME_DECIMALS - poolPair.decimalsOut))
      .decimalPlaces(0, 1);
  }

  spotPriceOutGivenIn(poolPair: OmniPoolPair): BigNumber {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.spotPriceOutGivenLrnaIn(poolPair);
    }

    const price = OmniMath.calculateSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString()
    );
    return bnum(price)
      .shiftedBy(-1 * (RUNTIME_DECIMALS - poolPair.decimalsIn))
      .decimalPlaces(0, 1);
  }

  spotPriceOutGivenLrnaIn(poolPair: OmniPoolPair): BigNumber {
    const price = OmniMath.calculateLrnaSpotPrice(poolPair.balanceOut.toString(), poolPair.hubReservesOut.toString());
    return bnum(price)
      .shiftedBy(-1 * (RUNTIME_DECIMALS - poolPair.decimalsIn))
      .decimalPlaces(0, 1);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    throw new Error('Not supported in OmniPool');
  }
}
