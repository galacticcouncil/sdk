import {
  BuyCtx,
  Pool,
  PoolBase,
  PoolError,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellCtx,
} from '../types';
import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';

export class AavePool implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;

  static fromPool(pool: PoolBase): AavePool {
    return new AavePool(pool);
  }

  constructor(pool: PoolBase) {
    this.type = PoolType.Aave;
    this.address = pool.address;
    this.tokens = pool.tokens;
    this.maxInRatio = pool.maxInRatio;
    this.maxOutRatio = pool.maxOutRatio;
    this.minTradingLimit = pool.minTradingLimit;
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): PoolPair {
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
      assetInED: ZERO,
      assetOutED: ZERO,
    } as PoolPair;
  }

  validateAndBuy(poolPair: PoolPair, amountOut: BigNumber): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const errors: PoolError[] = [];

    if (amountOut.isGreaterThan(poolPair.balanceOut)) {
      errors.push(PoolError.TradeNotAllowed);
    }

    return {
      amountIn: calculatedIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: 0,
      errors: errors,
    } as BuyCtx;
  }

  validateAndSell(poolPair: PoolPair, amountIn: BigNumber): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const errors: PoolError[] = [];

    if (calculatedOut.isGreaterThan(poolPair.balanceOut)) {
      errors.push(PoolError.TradeNotAllowed);
    }

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: calculatedOut,
      feePct: 0,
      errors: errors,
    } as SellCtx;
  }

  calculateInGivenOut(_poolPair: PoolPair, amountOut: BigNumber): BigNumber {
    return amountOut;
  }

  calculateOutGivenIn(_poolPair: PoolPair, amountIn: BigNumber): BigNumber {
    return amountIn;
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    return scale(ONE, poolPair.decimalsOut);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    return scale(ONE, poolPair.decimalsIn);
  }

  calculateTradeFee(_amount: BigNumber, _fees: PoolFees): BigNumber {
    return ZERO;
  }
}
