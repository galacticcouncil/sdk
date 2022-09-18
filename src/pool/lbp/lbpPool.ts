import { Pool, PoolBase, PoolPair, PoolToken, PoolType } from '../../types';
import { BigNumber, bnum, scale } from '../../utils/bignumber';
import { pctToBn } from '../../utils/math';
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
  tradeFee: string;
  tokens: WeightedPoolToken[];

  static fromPool(pool: PoolBase): LbpPool {
    return new LbpPool(pool.address, pool.tradeFee, pool.tokens as WeightedPoolToken[]);
  }

  constructor(address: string, swapFee: string, tokens: WeightedPoolToken[]) {
    this.type = PoolType.LBP;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
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
      tradeFee: pctToBn(this.tradeFee),
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
}
