import { RUNTIME_DECIMALS } from '@galacticcouncil/common';

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
import { math, fmt } from '../../utils';

import { OmniMath } from './OmniMath';

const { FeeUtils } = fmt;

export type OmniPoolPair = PoolPair & {
  hubReservesIn: bigint;
  hubReservesOut: bigint;
  sharesIn: bigint;
  sharesOut: bigint;
  tradeableIn: number;
  tradeableOut: number;
};

export type OmniPoolToken = PoolToken & {
  cap: bigint;
  hubReserves: bigint;
  protocolShares: bigint;
  shares: bigint;
};

export type OmniPoolFees = PoolFees & {
  assetFee: PoolFee;
  protocolFee: PoolFee;
};

export type OmniPoolBase = PoolBase & {
  hubAssetId: number;
};

export class OmniPool implements Pool {
  type: PoolType;
  address: string;
  tokens: OmniPoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;
  hubAssetId: number;

  static fromPool(pool: OmniPoolBase): OmniPool {
    return new OmniPool(pool);
  }

  constructor(pool: OmniPoolBase) {
    this.type = PoolType.Omni;
    this.address = pool.address;
    this.tokens = pool.tokens as OmniPoolToken[];
    this.maxInRatio = pool.maxInRatio;
    this.maxOutRatio = pool.maxOutRatio;
    this.minTradingLimit = pool.minTradingLimit;
    this.hubAssetId = pool.hubAssetId;
  }

  validatePair(_tokenIn: number, tokenOut: number): boolean {
    // Buying LRNA not allowed
    if (this.hubAssetId == tokenOut) {
      return false;
    }
    return true;
  }

  parsePair(tokenIn: number, tokenOut: number): OmniPoolPair {
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error('Pool does not contain tokenIn');
    if (tokenOutMeta == null) throw new Error('Pool does not contain tokenOut');

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      hubReservesIn: tokenInMeta.hubReserves,
      hubReservesOut: tokenOutMeta.hubReserves,
      sharesIn: tokenInMeta.shares,
      sharesOut: tokenOutMeta.shares,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: tokenInMeta.balance,
      balanceOut: tokenOutMeta.balance,
      tradeableIn: tokenInMeta.tradeable,
      tradeableOut: tokenOutMeta.tradeable,
      assetInEd: tokenInMeta.existentialDeposit,
      assetOutEd: tokenOutMeta.existentialDeposit,
    } as OmniPoolPair;
  }

  validateAndBuy(
    poolPair: OmniPoolPair,
    amountOut: bigint,
    fees: OmniPoolFees
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, fees);

    const feePct =
      calculatedIn === 0n ? 0 : math.calculateDiffToRef(amountIn, calculatedIn);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

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
    poolPair: OmniPoolPair,
    amountIn: bigint,
    fees: OmniPoolFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, fees);

    const feePct = math.calculateDiffToRef(calculatedOut, amountOut);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

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

  calculateInGivenOut(
    poolPair: OmniPoolPair,
    amountOut: bigint,
    fees?: OmniPoolFees
  ): bigint {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateLrnaInGivenOut(poolPair, amountOut, fees);
    }

    const result = OmniMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toString(),
      fees ? FeeUtils.toRaw(fees.assetFee).toString() : '0',
      fees ? FeeUtils.toRaw(fees.protocolFee).toString() : '0'
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateLrnaInGivenOut(
    poolPair: OmniPoolPair,
    amountOut: bigint,
    fees?: OmniPoolFees
  ): bigint {
    const result = OmniMath.calculateLrnaInGivenOut(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountOut.toString(),
      fees ? FeeUtils.toRaw(fees.assetFee).toString() : '0'
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateOutGivenIn(
    poolPair: OmniPoolPair,
    amountIn: bigint,
    fees?: OmniPoolFees
  ): bigint {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.calculateOutGivenLrnaIn(poolPair, amountIn, fees);
    }

    const result = OmniMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.sharesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toString(),
      fees ? FeeUtils.toRaw(fees.assetFee).toString() : '0',
      fees ? FeeUtils.toRaw(fees.protocolFee).toString() : '0'
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateOutGivenLrnaIn(
    poolPair: OmniPoolPair,
    amountIn: bigint,
    fees?: OmniPoolFees
  ): bigint {
    const result = OmniMath.calculateOutGivenLrnaIn(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.sharesOut.toString(),
      amountIn.toString(),
      fees ? FeeUtils.toRaw(fees.assetFee).toString() : '0'
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  spotPriceInGivenOut(poolPair: OmniPoolPair): bigint {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.spotPriceLrnaInGivenOut(poolPair);
    }

    const price = OmniMath.calculateSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsOut);
    return BigInt(price) / BigInt(base);
  }

  spotPriceLrnaInGivenOut(poolPair: OmniPoolPair): bigint {
    const price = OmniMath.calculateLrnaSpotPrice(
      poolPair.hubReservesOut.toString(),
      poolPair.balanceOut.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsOut);
    return BigInt(price) / BigInt(base);
  }

  spotPriceOutGivenIn(poolPair: OmniPoolPair): bigint {
    if (poolPair.assetIn == this.hubAssetId) {
      return this.spotPriceOutGivenLrnaIn(poolPair);
    }

    const price = OmniMath.calculateSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.hubReservesIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsIn);
    return BigInt(price) / BigInt(base);
  }

  spotPriceOutGivenLrnaIn(poolPair: OmniPoolPair): bigint {
    const price = OmniMath.calculateLrnaSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.hubReservesOut.toString()
    );
    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsIn);
    return BigInt(price) / BigInt(base);
  }
}
