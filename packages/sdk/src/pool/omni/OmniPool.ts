import { RUNTIME_DECIMALS } from '../../consts';
import {
  BuyTransfer,
  Pool,
  PoolBase,
  PoolError,
  PoolFee,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellTransfer,
} from '../../types';
import { BigNumber, bnum, ZERO } from '../../utils/bignumber';
import { toDecimals } from '../../utils/mapper';

import { OmniMath } from './OmniMath';

export type OmniPoolPair = PoolPair & {
  hubReservesIn: BigNumber;
  hubReservesOut: BigNumber;
  sharesIn: BigNumber;
  sharesOut: BigNumber;
  tradeableIn: number;
  tradeableOut: number;
};

export type OmniPoolToken = PoolToken & {
  hubReserves: string;
  shares: string;
  cap: string;
  protocolShares: string;
};

export type OmniPoolFees = PoolFees & {
  assetFee: PoolFee;
  protocolFee: PoolFee;
};

export type OmniPoolBase = PoolBase & {
  hubAssetId: string;
};

export class OmniPool implements Pool {
  type: PoolType;
  address: string;
  tokens: OmniPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  hubAssetId: string;

  static fromPool(pool: OmniPoolBase): OmniPool {
    return new OmniPool(
      pool.address,
      pool.tokens as OmniPoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.hubAssetId
    );
  }

  constructor(
    address: string,
    tokens: OmniPoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    hubAssetId: string
  ) {
    this.type = PoolType.Omni;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.hubAssetId = hubAssetId;
  }

  validatePair(_tokenIn: string, tokenOut: string): boolean {
    // Buying LRNA not allowed
    if (this.hubAssetId == tokenOut) {
      return false;
    }
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): OmniPoolPair {
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
      hubReservesIn: bnum(tokenInMeta.hubReserves),
      hubReservesOut: bnum(tokenOutMeta.hubReserves),
      sharesIn: bnum(tokenInMeta.shares),
      sharesOut: bnum(tokenOutMeta.shares),
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
      tradeableIn: tokenInMeta.tradeable,
      tradeableOut: tokenOutMeta.tradeable,
      assetInED,
      assetOutED,
    } as OmniPoolPair;
  }

  validateAndBuy(
    poolPair: OmniPoolPair,
    amountOut: BigNumber,
    fees: OmniPoolFees
  ): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, fees);

    const fee = amountIn.minus(calculatedIn);
    const feePct =
      calculatedIn === ZERO
        ? ZERO
        : fee.div(calculatedIn).multipliedBy(100).decimalPlaces(2);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

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
      feePct: feePct.toNumber(),
      errors: errors,
    } as BuyTransfer;
  }

  validateAndSell(
    poolPair: OmniPoolPair,
    amountIn: BigNumber,
    fees: OmniPoolFees
  ): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, fees);

    const fee = calculatedOut.minus(amountOut);
    const feePct = fee.div(calculatedOut).multipliedBy(100).decimalPlaces(2);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

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
      feePct: feePct.toNumber(),
      errors: errors,
    } as SellTransfer;
  }

  calculateInGivenOut(
    poolPair: OmniPoolPair,
    amountOut: BigNumber,
    fees?: OmniPoolFees
  ): BigNumber {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateLrnaInGivenOut(poolPair, amountOut, fees);
    }

    const price = OmniMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toFixed(0),
      fees ? toDecimals(fees.assetFee).toString() : ZERO.toString(),
      fees ? toDecimals(fees.protocolFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateLrnaInGivenOut(
    poolPair: OmniPoolPair,
    amountOut: BigNumber,
    fees?: OmniPoolFees
  ): BigNumber {
    const price = OmniMath.calculateLrnaInGivenOut(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toFixed(0),
      fees ? toDecimals(fees.assetFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(
    poolPair: OmniPoolPair,
    amountIn: BigNumber,
    fees?: OmniPoolFees
  ): BigNumber {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateOutGivenLrnaIn(poolPair, amountIn, fees);
    }

    const price = OmniMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toFixed(0),
      fees ? toDecimals(fees.assetFee).toString() : ZERO.toString(),
      fees ? toDecimals(fees.protocolFee).toString() : ZERO.toString()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenLrnaIn(
    poolPair: OmniPoolPair,
    amountIn: BigNumber,
    fees?: OmniPoolFees
  ): BigNumber {
    const price = OmniMath.calculateOutGivenLrnaIn(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toFixed(0),
      fees ? toDecimals(fees.assetFee).toString() : ZERO.toString()
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
    const price = OmniMath.calculateLrnaSpotPrice(
      poolPair.hubReservesOut.toString(),
      poolPair.balanceOut.toString()
    );
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
    const price = OmniMath.calculateLrnaSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString()
    );
    return bnum(price)
      .shiftedBy(-1 * (RUNTIME_DECIMALS - poolPair.decimalsIn))
      .decimalPlaces(0, 1);
  }
}
