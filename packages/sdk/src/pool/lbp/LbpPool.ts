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

import { LbpMath } from './LbpMath';

export type WeightedPoolPair = PoolPair & {
  weightIn: BigNumber;
  weightOut: BigNumber;
};

export type WeightedPoolToken = PoolToken & {
  weight: BigNumber;
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
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
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
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    fee: PoolFee,
    repayFeeApply: boolean
  ) {
    this.type = PoolType.LBP;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.fee = fee;
    this.repayFeeApply = repayFeeApply;
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): WeightedPoolPair {
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
      balanceIn: balanceIn,
      balanceOut: balanceOut,
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
    amountOut: BigNumber,
    fees: LbpPoolFees
  ): BuyCtx {
    const feeAsset = this.tokens[0].id;

    const errors: PoolError[] = [];

    if (amountOut.isLessThan(this.minTradingLimit)) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolOutReserve = poolPair.balanceOut.div(this.maxOutRatio);
    if (amountOut.isGreaterThan(poolOutReserve)) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    if (feeAsset === poolPair.assetOut) {
      const fee = this.calculateTradeFee(amountOut, fees);
      const feePct = FeeUtils.toPct(
        this.repayFeeApply ? fees.repayFee : fees.exchangeFee
      );
      const amountOutPlusFee = amountOut.plus(fee);
      const calculatedIn = this.calculateInGivenOut(poolPair, amountOutPlusFee);

      const poolInReserve = poolPair.balanceIn.div(this.maxInRatio);
      if (calculatedIn.isGreaterThan(poolInReserve)) {
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

      const poolInReserve = poolPair.balanceIn.div(this.maxInRatio);
      if (calculatedIn.isGreaterThan(poolInReserve)) {
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
    amountIn: BigNumber,
    fees: LbpPoolFees
  ): SellCtx {
    const feeAsset = this.tokens[0].id;

    const errors: PoolError[] = [];

    if (amountIn.isLessThan(this.minTradingLimit)) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    const poolInReserve = poolPair.balanceIn.div(this.maxInRatio);
    if (amountIn.isGreaterThan(poolInReserve)) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    if (feeAsset === poolPair.assetIn) {
      const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);

      const poolOutReserve = poolPair.balanceOut.div(this.maxOutRatio);
      if (calculatedOut.isGreaterThan(poolOutReserve)) {
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
      const amountOut = calculatedOut.minus(fee);

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
  }

  calculateInGivenOut(
    poolPair: WeightedPoolPair,
    amountOut: BigNumber
  ): BigNumber {
    const price = LbpMath.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      amountOut.toFixed(0)
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(
    poolPair: WeightedPoolPair,
    amountIn: BigNumber
  ): BigNumber {
    const price = LbpMath.calculateOutGivenIn(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      amountIn.toFixed(0)
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  spotPriceInGivenOut(poolPair: WeightedPoolPair): BigNumber {
    const price = LbpMath.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.weightOut.toString(),
      poolPair.weightIn.toString(),
      scale(ONE, poolPair.decimalsOut).toString()
    );
    return bnum(price);
  }

  spotPriceOutGivenIn(poolPair: WeightedPoolPair): BigNumber {
    const price = LbpMath.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      scale(ONE, poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber, fees: LbpPoolFees): BigNumber {
    const fee = LbpMath.calculatePoolTradeFee(
      amount.toString(),
      this.repayFeeApply ? fees.repayFee[0] : fees.exchangeFee[0],
      this.repayFeeApply ? fees.repayFee[1] : fees.exchangeFee[1]
    );
    return bnum(fee);
  }
}
