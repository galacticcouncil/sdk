import { Pool, PoolBase, PoolFee, PoolPair, PoolToken, PoolType } from '../../types';
import { BigNumber, bnum, scale } from '../../utils/bignumber';
import math from './xykMath';

export class XykPool implements Pool {
  type: PoolType;
  address: string;
  tradeFee: PoolFee;
  tokens: PoolToken[];

  static fromPool(pool: PoolBase): XykPool {
    return new XykPool(pool.address, pool.tradeFee, pool.tokens);
  }

  constructor(address: string, swapFee: PoolFee, tokens: PoolToken[]) {
    this.type = PoolType.XYK;
    this.address = address;
    this.tradeFee = swapFee;
    this.tokens = tokens;
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
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as PoolPair;
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toString()
    );
    return bnum(price);
  }

  getSpotPriceIn(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      scale(bnum(1), poolPair.decimalsOut).toString()
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

  getSpotPriceOut(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      scale(bnum(1), poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = math.calculatePoolTradeFee(amount.toString(), this.tradeFee[0], this.tradeFee[1]);
    return bnum(fee);
  }
}
