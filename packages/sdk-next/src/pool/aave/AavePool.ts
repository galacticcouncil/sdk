import { big, RUNTIME_DECIMALS } from '@galacticcouncil/common';

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
import { XcmV3Multilocation } from '../../types';

export type AavePoolToken = PoolToken & {
  location: XcmV3Multilocation;
};

export class AavePool implements Pool {
  type: PoolType;
  address: string;
  tokens: AavePoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;

  static fromPool(pool: PoolBase): AavePool {
    return new AavePool(pool);
  }

  constructor(pool: PoolBase) {
    this.type = PoolType.Aave;
    this.address = pool.address;
    this.tokens = pool.tokens as AavePoolToken[];
    this.maxInRatio = pool.maxInRatio;
    this.maxOutRatio = pool.maxOutRatio;
    this.minTradingLimit = pool.minTradingLimit;
  }

  validatePair(_tokenIn: number, _tokenOut: number): boolean {
    return true;
  }

  parsePair(tokenIn: number, tokenOut: number): PoolPair {
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
      assetInEd: 0n,
      assetOutEd: 0n,
    } as PoolPair;
  }

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: bigint,
    _fees: PoolFees
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const errors: PoolError[] = [];

    if (amountOut > poolPair.balanceOut) {
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

  validateAndSell(
    poolPair: PoolPair,
    amountIn: bigint,
    _fees: PoolFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const errors: PoolError[] = [];

    if (calculatedOut > poolPair.balanceOut) {
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

  calculateInGivenOut(_poolPair: PoolPair, amountOut: bigint): bigint {
    return amountOut;
  }

  calculateOutGivenIn(_poolPair: PoolPair, amountIn: bigint): bigint {
    return amountIn;
  }

  spotPriceInGivenOut(_poolPair: PoolPair): bigint {
    return big.toBigInt(1, RUNTIME_DECIMALS);
  }

  spotPriceOutGivenIn(_poolPair: PoolPair): bigint {
    return big.toBigInt(1, RUNTIME_DECIMALS);
  }

  calculateTradeFee(_amount: bigint, _fees: PoolFees): bigint {
    return 0n;
  }
}
