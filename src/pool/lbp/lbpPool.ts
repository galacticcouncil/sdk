import { PoolConfigNotFound } from '../../errors';
import { BuyTransfer, Pool, PoolBase, PoolFee, PoolPair, PoolToken, PoolType, SellTransfer } from '../../types';
import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';
import { toPct } from '../../utils/mapper';
import { LbpMath } from './lbpMath';

export type WeightedPoolPair = PoolPair & {
  weightIn: BigNumber;
  weightOut: BigNumber;
};

export type WeightedPoolToken = PoolToken & {
  weight: BigNumber;
};

export type LbpPoolBase = PoolBase & {
  repayFee: PoolFee;
  repayFeeApply: boolean;
};

export class LbpPool implements Pool {
  type: PoolType;
  address: string;
  tradeFee: PoolFee;
  tokens: WeightedPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  repayFee: PoolFee;
  repayFeeApply: boolean;

  static fromPool(pool: LbpPoolBase): LbpPool {
    if (!pool.repayFee) throw new PoolConfigNotFound(PoolType.LBP, 'repayFee');
    if (!pool.repayFeeApply) throw new PoolConfigNotFound(PoolType.LBP, 'repayFeeApply');
    return new LbpPool(
      pool.address,
      pool.tradeFee,
      pool.tokens as WeightedPoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.repayFee,
      pool.repayFeeApply
    );
  }

  constructor(
    address: string,
    swapFee: PoolFee,
    tokens: WeightedPoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    repayFee: PoolFee,
    repayFeeApply: boolean
  ) {
    this.type = PoolType.LBP;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.repayFee = repayFee;
    this.repayFeeApply = repayFeeApply;
  }

  validPair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePoolPair(tokenIn: string, tokenOut: string): WeightedPoolPair {
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
      weightIn: tokenInMeta.weight,
      weightOut: tokenOutMeta.weight,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as WeightedPoolPair;
  }

  /**
   * Validate buy transfer
   *
   * a) Accumulated asset is bought (out) from the pool for distributed asset (in) - User(Buyer) bears the fee
   * b) Distributed asset is bought (out) from the pool for accumualted asset (in) - Pool bears the fee
   */
  validateBuy(poolPair: WeightedPoolPair, amountOut: BigNumber): BuyTransfer {
    const feeAsset = this.tokens[0].id;
    if (feeAsset === poolPair.assetOut) {
      const fee = this.calculateTradeFee(amountOut);
      const amountOutPlusFee = amountOut.plus(fee);
      const calculatedIn = this.calculateInGivenOut(poolPair, amountOutPlusFee);
      const feePct = toPct(this.repayFeeApply ? this.repayFee : this.tradeFee);
      return {
        amountIn: calculatedIn,
        calculatedIn: calculatedIn,
        amountOut: amountOut,
        feePct: feePct,
      } as BuyTransfer;
    } else {
      const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
      return { amountIn: calculatedIn, calculatedIn: calculatedIn, amountOut: amountOut, feePct: 0 } as BuyTransfer;
    }
  }

  /**
   * Validate sell transfer
   *
   * a) Accumulated asset is sold (in) to the pool for distributed asset (out) - Pool bears the fee
   * b) Distributed asset is sold (in) to the pool for accumualted asset (out) - User(Seller) bears the fee
   */
  validateSell(poolPair: WeightedPoolPair, amountIn: BigNumber): SellTransfer {
    const feeAsset = this.tokens[0].id;
    if (feeAsset === poolPair.assetIn) {
      const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
      return {
        amountIn: amountIn,
        calculatedOut: calculatedOut,
        amountOut: calculatedOut,
        feePct: 0,
      } as SellTransfer;
    } else {
      const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
      const fee = this.calculateTradeFee(calculatedOut);
      const amountOut = calculatedOut.minus(fee);
      const feePct = toPct(this.repayFeeApply ? this.repayFee : this.tradeFee);
      return {
        amountIn: amountIn,
        calculatedOut: calculatedOut,
        amountOut: amountOut,
        feePct: feePct,
      } as SellTransfer;
    }
  }

  calculateInGivenOut(poolPair: WeightedPoolPair, amountOut: BigNumber): BigNumber {
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

  calculateOutGivenIn(poolPair: WeightedPoolPair, amountIn: BigNumber): BigNumber {
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

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = LbpMath.calculatePoolTradeFee(
      amount.toString(),
      this.repayFeeApply ? this.repayFee[0] : this.tradeFee[0],
      this.repayFeeApply ? this.repayFee[1] : this.tradeFee[1]
    );
    return bnum(fee);
  }
}
