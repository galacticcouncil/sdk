import { Pool, PoolBase, PoolFee, PoolPair, PoolToken, PoolType } from '../../types';
import { BigNumber, bnum, scale } from '../../utils/bignumber';
import math from './lbpMath';

export type WeightedPoolPair = PoolPair & {
  weightIn: BigNumber;
  weightOut: BigNumber;
};

export type WeightedPoolToken = PoolToken & {
  weight: BigNumber;
};

export class LbpPool implements Pool {
  type: PoolType;
  address: string;
  tradeFee: PoolFee;
  tokens: WeightedPoolToken[];
  repayFee: PoolFee;
  repayFeeApply: boolean;

  static fromPool(pool: PoolBase): LbpPool {
    if (!pool.repayFee) throw new Error('LBP Pool missing repayFee');
    if (!pool.repayFeeApply) throw new Error('LBP Pool missing repayFeeApply');
    return new LbpPool(
      pool.address,
      pool.tradeFee,
      pool.tokens as WeightedPoolToken[],
      pool.repayFee,
      pool.repayFeeApply
    );
  }

  constructor(
    address: string,
    swapFee: PoolFee,
    tokens: WeightedPoolToken[],
    repayFee: PoolFee,
    repayFeeApply: boolean
  ) {
    this.type = PoolType.LBP;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
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
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      weightIn: tokenInMeta.weight,
      weightOut: tokenOutMeta.weight,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as WeightedPoolPair;
  }

  calculateInGivenOut(poolPair: WeightedPoolPair, amountOut: BigNumber): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.weightOut.toString(),
      poolPair.weightIn.toString(),
      amountOut.toString()
    );
    return bnum(price);
  }

  getSpotPriceIn(poolPair: WeightedPoolPair): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      poolPair.weightOut.toString(),
      poolPair.weightIn.toString(),
      scale(bnum(1), poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateOutGivenIn(poolPair: WeightedPoolPair, amountIn: BigNumber): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      amountIn.toString()
    );
    return bnum(price);
  }

  getSpotPriceOut(poolPair: WeightedPoolPair): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      poolPair.weightIn.toString(),
      poolPair.weightOut.toString(),
      scale(bnum(1), poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = math.calculatePoolTradeFee(
      amount.toString(),
      this.repayFeeApply ? this.repayFee[0] : this.tradeFee[0],
      this.repayFeeApply ? this.repayFee[1] : this.tradeFee[1]
    );
    return bnum(fee);
  }
}
