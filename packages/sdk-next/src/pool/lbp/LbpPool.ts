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

import { fmt } from '../../utils';

import { LbpMath } from './LbpMath';

const { FeeUtils } = fmt;

export type WeightedPoolPair = PoolPair & {
  weightIn: bigint;
  weightOut: bigint;
};

export type WeightedPoolToken = PoolToken & {
  weight: bigint;
};

export type LbpPoolFees = PoolFees & {
  exchangeFee: PoolFee;
  repayFee: PoolFee;
};

export type LbpPoolBase = PoolBase & {
  fee: PoolFee;
  repayFeeApply: boolean;
};

export class LbpPool implements Pool {
  type: PoolType;
  address: string;
  tokens: WeightedPoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;
  fee: PoolFee;
  repayFeeApply: boolean;

  static fromPool(pool: LbpPoolBase): LbpPool {
    return new LbpPool(
      pool.address,
      pool.tokens as WeightedPoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.fee,
      pool.repayFeeApply
    );
  }

  constructor(
    address: string,
    tokens: WeightedPoolToken[],
    maxInRatio: bigint,
    maxOutRatio: bigint,
    minTradingLimit: bigint,
    fee: PoolFee,
    repayFeeApply: boolean
  ) {
    this.type = PoolType.LBP;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRatio;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradingLimit;
    this.fee = fee;
    this.repayFeeApply = repayFeeApply;
  }

  validatePair(_tokenIn: number, _tokenOut: number): boolean {
    return true;
  }

  parsePair(tokenIn: number, tokenOut: number): WeightedPoolPair {
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error('Pool does not contain tokenIn');
    if (tokenOutMeta == null) throw new Error('Pool does not contain tokenOut');

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      balanceIn: tokenInMeta.balance,
      balanceOut: tokenOutMeta.balance,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      weightIn: tokenInMeta.weight,
      weightOut: tokenOutMeta.weight,
    } as WeightedPoolPair;
  }

  /**
   * Validate buy transfer
   *
   * a) Accumulated asset is bought (out) from the pool for distributed asset (in) - User(Buyer) bears the fee
   * b) Distributed asset is bought (out) from the pool for accumualted asset (in) - Pool bears the fee
   */
  validateAndBuy(
    poolPair: WeightedPoolPair,
    amountOut: bigint,
    fees: LbpPoolFees
  ): BuyCtx {
    const feeAsset = this.tokens[0].id;

    const errors: PoolError[] = [];

    if (amountOut < this.minTradingLimit) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolOutReserve = poolPair.balanceOut / this.maxOutRatio;
    if (amountOut > poolOutReserve) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    if (feeAsset === poolPair.assetOut) {
      const fee = this.calculateTradeFee(amountOut, fees);
      const feePct = FeeUtils.toPct(
        this.repayFeeApply ? fees.repayFee : fees.exchangeFee
      );
      const amountOutPlusFee = amountOut + fee;
      const calculatedIn = this.calculateInGivenOut(poolPair, amountOutPlusFee);

      const poolInReserve = poolPair.balanceIn / this.maxInRatio;
      if (calculatedIn > poolInReserve) {
        errors.push(PoolError.MaxInRatioExceeded);
      }

      return {
        amountIn: calculatedIn,
        calculatedIn: calculatedIn,
        amountOut: amountOut,
        feePct: feePct,
        errors: errors,
      } as BuyCtx;
    } else {
      const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);

      const poolInReserve = poolPair.balanceIn / this.maxInRatio;
      if (calculatedIn > poolInReserve) {
        errors.push(PoolError.MaxInRatioExceeded);
      }

      return {
        amountIn: calculatedIn,
        calculatedIn: calculatedIn,
        amountOut: amountOut,
        feePct: 0,
        errors: errors,
      } as BuyCtx;
    }
  }

  /**
   * Validate sell transfer
   *
   * a) Accumulated asset is sold (in) to the pool for distributed asset (out) - Pool bears the fee
   * b) Distributed asset is sold (in) to the pool for accumualted asset (out) - User(Seller) bears the fee
   */
  validateAndSell(
    poolPair: WeightedPoolPair,
    amountIn: bigint,
    fees: LbpPoolFees
  ): SellCtx {
    const feeAsset = this.tokens[0].id;

    const errors: PoolError[] = [];

    if (amountIn < this.minTradingLimit) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolInReserve = poolPair.balanceIn / this.maxInRatio;
    if (amountIn > poolInReserve) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    if (feeAsset === poolPair.assetIn) {
      const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);

      const poolOutReserve = poolPair.balanceOut / this.maxOutRatio;
      if (calculatedOut > poolOutReserve) {
        errors.push(PoolError.MaxOutRatioExceeded);
      }

      return {
        amountIn: amountIn,
        calculatedOut: calculatedOut,
        amountOut: calculatedOut,
        feePct: 0,
        errors: errors,
      } as SellCtx;
    } else {
      const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
      const fee = this.calculateTradeFee(calculatedOut, fees);
      const feePct = FeeUtils.toPct(
        this.repayFeeApply ? fees.repayFee : fees.exchangeFee
      );
      const amountOut = calculatedOut - fee;

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
  }

  calculateInGivenOut(poolPair: WeightedPoolPair, amountOut: bigint): bigint {
    const result = LbpMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      amountOut.toString()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateOutGivenIn(poolPair: WeightedPoolPair, amountIn: bigint): bigint {
    const result = LbpMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      amountIn.toString()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  spotPriceInGivenOut(poolPair: WeightedPoolPair): bigint {
    const spot = LbpMath.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.weightOut.toString(),
      poolPair.weightIn.toString(),
      this.maxOutRatio.toString()
    );
    return BigInt(spot);
  }

  spotPriceOutGivenIn(poolPair: WeightedPoolPair): bigint {
    const spot = LbpMath.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      this.maxInRatio.toString()
    );
    return BigInt(spot);
  }

  calculateTradeFee(amount: bigint, fees: LbpPoolFees): bigint {
    const fee = LbpMath.calculatePoolTradeFee(
      amount.toString(),
      this.repayFeeApply ? fees.repayFee[0] : fees.exchangeFee[0],
      this.repayFeeApply ? fees.repayFee[1] : fees.exchangeFee[1]
    );
    return BigInt(fee);
  }
}
