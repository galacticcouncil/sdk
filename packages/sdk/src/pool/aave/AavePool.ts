import {
  BuyTransfer,
  Pool,
  PoolBase,
  PoolError,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellTransfer,
} from '../../types';
import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';

export class AavePool implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;

  static fromPool(pool: PoolBase): AavePool {
    return new AavePool(
      pool.address,
      pool.tokens as PoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit
    );
  }

  constructor(
    address: string,
    tokens: PoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number
  ) {
    this.type = PoolType.Aave;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
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

  validateAndBuy(
    poolPair: PoolPair,
    amountOut: BigNumber,
    _fees: PoolFees
  ): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);

    const errors: PoolError[] = [];

    const poolOutReserve = poolPair.balanceOut;
    if (amountOut.isGreaterThan(poolOutReserve)) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    const poolInReserve = poolPair.balanceIn;
    if (calculatedIn.isGreaterThan(poolInReserve)) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    return {
      amountIn: calculatedIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: 0,
      errors: errors,
    } as BuyTransfer;
  }

  validateAndSell(
    poolPair: PoolPair,
    amountIn: BigNumber,
    _fees: PoolFees
  ): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const errors: PoolError[] = [];

    const poolInReserve = poolPair.balanceIn;
    if (amountIn.isGreaterThan(poolInReserve)) {
      errors.push(PoolError.MaxInRatioExceeded);
    }

    const poolOutReserve = poolPair.balanceOut;
    if (calculatedOut.isGreaterThan(poolOutReserve)) {
      errors.push(PoolError.MaxOutRatioExceeded);
    }

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: calculatedOut,
      feePct: 0,
      errors: errors,
    } as SellTransfer;
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
