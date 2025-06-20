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
import { OmniMath } from '../omni';

import { RUNTIME_DECIMALS, TRADEABLE_DEFAULT } from '../../consts';
import { fmt, json } from '../../utils';

import { StableMath } from './StableMath';

export type StableSwapPair = PoolPair & {
  tradeableIn: number;
  tradeableOut: number;
};

export type StableSwapFees = PoolFees & {
  fee: PoolFee;
};

export type StableSwapBase = PoolBase & {
  amplification: bigint;
  id: string;
  fee: PoolFee;
  totalIssuance: bigint;
};

export class StableSwap implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: bigint;
  maxOutRatio: bigint;
  minTradingLimit: bigint;
  amplification: bigint;
  id: number;
  fee: PoolFee;
  totalIssuance: bigint;

  static fromPool(pool: StableSwapBase): StableSwap {
    return new StableSwap(
      pool.address,
      pool.tokens as PoolToken[],
      pool.maxInRatio,
      pool.maxOutRatio,
      pool.minTradingLimit,
      pool.amplification,
      pool.id,
      pool.fee,
      pool.totalIssuance
    );
  }

  constructor(
    address: string,
    tokens: PoolToken[],
    maxInRation: bigint,
    maxOutRatio: bigint,
    minTradeLimit: bigint,
    amplification: bigint,
    id: number,
    fee: PoolFee,
    totalIssuance: bigint
  ) {
    this.type = PoolType.Stable;
    this.address = address;
    this.tokens = tokens;
    this.maxInRatio = maxInRation;
    this.maxOutRatio = maxOutRatio;
    this.minTradingLimit = minTradeLimit;
    this.amplification = amplification;
    this.id = id;
    this.fee = fee;
    this.totalIssuance = totalIssuance;
  }

  validatePair(_tokenIn: number, _tokenOut: number): boolean {
    return true;
  }

  parsePair(tokenIn: number, tokenOut: number): StableSwapPair {
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
      tradeableIn:
        this.id === tokenIn ? TRADEABLE_DEFAULT : tokenInMeta.tradeable,
      tradeableOut:
        this.id === tokenOut ? TRADEABLE_DEFAULT : tokenOutMeta.tradeable,
      assetInEd: tokenInMeta.existentialDeposit,
      assetOutEd: tokenOutMeta.existentialDeposit,
    } as StableSwapPair;
  }

  validateAndBuy(
    poolPair: StableSwapPair,
    amountOut: bigint,
    fees: StableSwapFees
  ): BuyCtx {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, fees);
    const feePct = fmt.toPct(fees.fee);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

    if (amountOut < this.minTradingLimit || calculatedIn < poolPair.assetInEd) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    return {
      amountIn: amountIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as BuyCtx;
  }

  validateAndSell(
    poolPair: StableSwapPair,
    amountIn: bigint,
    fees: StableSwapFees
  ): SellCtx {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, fees);
    const feePct = fmt.toPct(fees.fee);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

    if (
      amountIn < this.minTradingLimit ||
      calculatedOut < poolPair.assetOutEd
    ) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as SellCtx;
  }

  private calculateIn(
    poolPair: PoolPair,
    amountOut: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateInGivenOut(
      this.getReserves(),
      Number(poolPair.assetIn),
      Number(poolPair.assetOut),
      amountOut.toString(),
      this.amplification.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  private calculateAddOneAsset(
    poolPair: PoolPair,
    amountOut: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateAddOneAsset(
      this.getReserves(),
      amountOut.toString(),
      Number(poolPair.assetIn),
      this.amplification.toString(),
      this.totalIssuance.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  private calculateSharesForAmount(
    poolPair: PoolPair,
    amountOut: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateSharesForAmount(
      this.getReserves(),
      Number(poolPair.assetOut),
      amountOut.toString(),
      this.amplification.toString(),
      this.totalIssuance.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateInGivenOut(
    poolPair: PoolPair,
    amountOut: bigint,
    fees?: StableSwapFees
  ): bigint {
    if (poolPair.assetOut == this.id) {
      return this.calculateAddOneAsset(poolPair, amountOut, fees);
    }

    if (poolPair.assetIn == this.id) {
      return this.calculateSharesForAmount(poolPair, amountOut, fees);
    }

    return this.calculateIn(poolPair, amountOut, fees);
  }

  spotPriceInGivenOut(poolPair: PoolPair): bigint {
    const spot = StableMath.calculateSpotPriceWithFee(
      this.id.toString(),
      this.getReserves(),
      this.amplification.toString(),
      poolPair.assetOut.toString(),
      poolPair.assetIn.toString(),
      this.totalIssuance.toString(),
      '0',
      this.getPegs()
    );

    if (poolPair.assetOut == this.id) {
      return BigInt(spot);
    }

    if (poolPair.assetIn == this.id) {
      const base = Math.pow(10, poolPair.decimalsIn - poolPair.decimalsOut);
      return BigInt(spot) / BigInt(base);
    }

    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsIn);
    return BigInt(spot) / BigInt(base);
  }

  private calculateOut(
    poolPair: PoolPair,
    amountIn: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateOutGivenIn(
      this.getReserves(),
      Number(poolPair.assetIn),
      Number(poolPair.assetOut),
      amountIn.toString(),
      this.amplification.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  private calculateWithdrawOneAsset(
    poolPair: PoolPair,
    amountIn: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateLiquidityOutOneAsset(
      this.getReserves(),
      amountIn.toString(),
      Number(poolPair.assetOut),
      this.amplification.toString(),
      this.totalIssuance.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  private calculateShares(
    poolPair: PoolPair,
    amountIn: bigint,
    fees?: StableSwapFees
  ) {
    const result = StableMath.calculateShares(
      this.getReserves(),
      this.getAssets(poolPair.assetIn, amountIn),
      this.amplification.toString(),
      this.totalIssuance.toString(),
      fees ? fmt.toDecimals(fees.fee).toString() : '0',
      this.getPegs()
    );
    const price = BigInt(result);
    return price < 0n ? 0n : price;
  }

  calculateOutGivenIn(
    poolPair: PoolPair,
    amountIn: bigint,
    fees?: StableSwapFees
  ): bigint {
    if (poolPair.assetIn == this.id) {
      return this.calculateWithdrawOneAsset(poolPair, amountIn, fees);
    }

    if (poolPair.assetOut == this.id) {
      return this.calculateShares(poolPair, amountIn, fees);
    }

    return this.calculateOut(poolPair, amountIn, fees);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): bigint {
    const spot = StableMath.calculateSpotPriceWithFee(
      this.id.toString(),
      this.getReserves(),
      this.amplification.toString(),
      poolPair.assetIn.toString(),
      poolPair.assetOut.toString(),
      this.totalIssuance.toString(),
      '0',
      this.getPegs()
    );

    if (poolPair.assetIn == this.id) {
      return BigInt(spot);
    }

    if (poolPair.assetOut == this.id) {
      const base = Math.pow(10, poolPair.decimalsOut - poolPair.decimalsIn);
      return BigInt(spot) / BigInt(base);
    }

    const base = Math.pow(10, RUNTIME_DECIMALS - poolPair.decimalsOut);
    return BigInt(spot) / BigInt(base);
  }

  private getPegs(): string {
    const pegs = StableMath.defaultPegs(this.tokens.length - 1);
    return JSON.stringify(pegs);
  }

  private getReserves(): string {
    const reserves = this.tokens
      .filter((token) => token.id != this.id)
      .map(({ id, balance, decimals }: PoolToken) => {
        return {
          asset_id: id,
          amount: balance,
          decimals: decimals,
        };
      });
    return JSON.stringify(reserves, json.jsonFormatter);
  }

  private getAssets(assetId: number, amount: bigint): string {
    const asset = {
      asset_id: Number(assetId),
      amount: amount.toString(),
    };
    return JSON.stringify([asset], json.jsonFormatter);
  }
}
