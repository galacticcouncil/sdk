import { BuyTransfer, Pool, PoolBase, PoolFee, PoolPair, PoolToken, PoolType, SellTransfer } from '../../types';
import { BigNumber, bnum, ONE, scale } from '../../utils/bignumber';
import { toPct } from '../../utils/mapper';
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
      assetIn: tokenIn,
      assetOut: tokenOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
    } as PoolPair;
  }

  validateBuy(poolPair: PoolPair, amountOut: BigNumber): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const fee = this.calculateTradeFee(calculatedIn);
    const amountIn = calculatedIn.plus(fee);
    const feePct = toPct(this.tradeFee);
    return { amountIn: amountIn, calculatedIn: calculatedIn, amountOut: amountOut, feePct: feePct } as BuyTransfer;
  }

  validateSell(poolPair: PoolPair, amountIn: BigNumber): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const fee = this.calculateTradeFee(calculatedOut);
    const amountOut = calculatedOut.minus(fee);
    const feePct = toPct(this.tradeFee);
    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: amountOut,
      feePct: feePct,
    } as SellTransfer;
  }

  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    const price = math.calculateInGivenOut(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      amountOut.toString()
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

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceOut.toString(),
      poolPair.balanceIn.toString(),
      scale(ONE, poolPair.decimalsOut).toString()
    );
    return bnum(price);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const price = math.getSpotPrice(
      poolPair.balanceIn.toString(),
      poolPair.balanceOut.toString(),
      scale(ONE, poolPair.decimalsIn).toString()
    );
    return bnum(price);
  }

  calculateTradeFee(amount: BigNumber): BigNumber {
    const fee = math.calculatePoolTradeFee(amount.toString(), this.tradeFee[0], this.tradeFee[1]);
    return bnum(fee);
  }
}
