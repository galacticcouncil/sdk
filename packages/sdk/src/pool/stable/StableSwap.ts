import { TRADEABLE_DEFAULT } from '../../consts';
import {
  BuyTransfer,
  Pool,
  PoolBase,
  PoolError,
  PoolFee,
  PoolFees,
  PoolPair,
  PoolToken,
  PoolType,
  SellTransfer,
} from '../../types';
import { BigNumber, bnum, ONE, scale, ZERO } from '../../utils/bignumber';
import { toDecimals, toPct } from '../../utils/mapper';

import { StableMath } from './StableMath';
import { OmniMath } from '../omni/OmniMath';

export type StableSwapPair = PoolPair & {
  tradeableIn: number;
  tradeableOut: number;
};

export type StableSwapFees = PoolFees & {
  fee: PoolFee;
};

export type StableSwapBase = PoolBase & {
  amplification: string;
  id: string;
  fee: PoolFee;
  totalIssuance: string;
  pegs: string[][];
  pegsFee: PoolFee;
};

export class StableSwap implements Pool {
  type: PoolType;
  address: string;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  amplification: string;
  id: string;
  fee: PoolFee;
  totalIssuance: string;
  pegs: string[][];
  pegsFee: PoolFee;

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
      pool.totalIssuance,
      pool.pegs,
      pool.pegsFee
    );
  }

  constructor(
    address: string,
    tokens: PoolToken[],
    maxInRation: number,
    maxOutRatio: number,
    minTradeLimit: number,
    amplification: string,
    id: string,
    fee: PoolFee,
    totalIssuance: string,
    pegs: string[][],
    pegsFee: PoolFee
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
    this.pegs = pegs;
    this.pegsFee = pegsFee;
  }

  validatePair(_tokenIn: string, _tokenOut: string): boolean {
    return true;
  }

  parsePair(tokenIn: string, tokenOut: string): StableSwapPair {
    const tokensMap = new Map(this.tokens.map((token) => [token.id, token]));
    const tokenInMeta = tokensMap.get(tokenIn);
    const tokenOutMeta = tokensMap.get(tokenOut);

    if (tokenInMeta == null) throw new Error('Pool does not contain tokenIn');
    if (tokenOutMeta == null) throw new Error('Pool does not contain tokenOut');

    const balanceIn = bnum(tokenInMeta.balance);
    const balanceOut = bnum(tokenOutMeta.balance);

    const assetInED = bnum(tokenInMeta.existentialDeposit);
    const assetOutED = bnum(tokenOutMeta.existentialDeposit);

    return {
      assetIn: tokenIn,
      assetOut: tokenOut,
      balanceIn: balanceIn,
      balanceOut: balanceOut,
      decimalsIn: tokenInMeta.decimals,
      decimalsOut: tokenOutMeta.decimals,
      tradeableIn:
        this.id === tokenIn ? TRADEABLE_DEFAULT : tokenInMeta.tradeable,
      tradeableOut:
        this.id === tokenOut ? TRADEABLE_DEFAULT : tokenOutMeta.tradeable,
      assetInED,
      assetOutED,
    } as StableSwapPair;
  }

  validateAndBuy(
    poolPair: StableSwapPair,
    amountOut: BigNumber,
    fees: StableSwapFees
  ): BuyTransfer {
    const calculatedIn = this.calculateInGivenOut(poolPair, amountOut);
    const amountIn = this.calculateInGivenOut(poolPair, amountOut, fees);
    const feePct = toPct(fees.fee);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

    if (
      amountOut.isLessThan(this.minTradingLimit) ||
      calculatedIn.isLessThan(poolPair.assetInED)
    ) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    return {
      amountIn: amountIn,
      calculatedIn: calculatedIn,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as BuyTransfer;
  }

  validateAndSell(
    poolPair: StableSwapPair,
    amountIn: BigNumber,
    fees: StableSwapFees
  ): SellTransfer {
    const calculatedOut = this.calculateOutGivenIn(poolPair, amountIn);
    const amountOut = this.calculateOutGivenIn(poolPair, amountIn, fees);
    const feePct = toPct(fees.fee);

    const errors: PoolError[] = [];
    const isSellAllowed = OmniMath.isSellAllowed(poolPair.tradeableIn);
    const isBuyAllowed = OmniMath.isBuyAllowed(poolPair.tradeableOut);

    if (!isSellAllowed || !isBuyAllowed) {
      errors.push(PoolError.TradeNotAllowed);
    }

    if (
      amountIn.isLessThan(this.minTradingLimit) ||
      calculatedOut.isLessThan(poolPair.assetOutED)
    ) {
      errors.push(PoolError.InsufficientTradingAmount);
    }

    return {
      amountIn: amountIn,
      calculatedOut: calculatedOut,
      amountOut: amountOut,
      feePct: feePct,
      errors: errors,
    } as SellTransfer;
  }

  private calculateIn(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateInGivenOut(
      this.getReserves(),
      Number(poolPair.assetIn),
      Number(poolPair.assetOut),
      amountOut.toFixed(0),
      this.amplification,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  private calculateAddOneAsset(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateAddOneAsset(
      this.getReserves(),
      amountOut.toFixed(0),
      Number(poolPair.assetIn),
      this.amplification,
      this.totalIssuance,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  private calculateSharesForAmount(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateSharesForAmount(
      this.getReserves(),
      Number(poolPair.assetOut),
      amountOut.toFixed(0),
      this.amplification,
      this.totalIssuance,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateInGivenOut(
    poolPair: PoolPair,
    amountOut: BigNumber,
    fees?: StableSwapFees
  ): BigNumber {
    if (poolPair.assetOut == this.id) {
      return this.calculateAddOneAsset(poolPair, amountOut, fees);
    }

    if (poolPair.assetIn == this.id) {
      return this.calculateSharesForAmount(poolPair, amountOut, fees);
    }

    return this.calculateIn(poolPair, amountOut, fees);
  }

  spotPriceInGivenOut(poolPair: PoolPair): BigNumber {
    const spot = StableMath.calculateSpotPriceWithFee(
      this.id,
      this.getReserves(),
      this.amplification,
      poolPair.assetOut,
      poolPair.assetIn,
      this.totalIssuance,
      '0',
      this.getPegs()
    );

    if (poolPair.assetOut == this.id) {
      return bnum(spot);
    }

    if (poolPair.assetIn == this.id) {
      const base = scale(ONE, poolPair.decimalsIn - poolPair.decimalsOut);
      return bnum(spot).div(base);
    }

    const base = scale(ONE, 18 - poolPair.decimalsIn);
    return bnum(spot).div(base);
  }

  private calculateOut(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateOutGivenIn(
      this.getReserves(),
      Number(poolPair.assetIn),
      Number(poolPair.assetOut),
      amountIn.toFixed(0),
      this.amplification,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  private calculateWithdrawOneAsset(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateLiquidityOutOneAsset(
      this.getReserves(),
      amountIn.toFixed(0),
      Number(poolPair.assetOut),
      this.amplification,
      this.totalIssuance,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  private calculateShares(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: StableSwapFees
  ) {
    const price = StableMath.calculateShares(
      this.getReserves(),
      this.getAssets(poolPair.assetIn, amountIn),
      this.amplification,
      this.totalIssuance,
      fees ? toDecimals(fees.fee).toString() : ZERO.toString(),
      this.getPegs()
    );
    const priceBN = bnum(price);
    return priceBN.isNegative() ? ZERO : priceBN;
  }

  calculateOutGivenIn(
    poolPair: PoolPair,
    amountIn: BigNumber,
    fees?: StableSwapFees
  ): BigNumber {
    if (poolPair.assetIn == this.id) {
      return this.calculateWithdrawOneAsset(poolPair, amountIn, fees);
    }

    if (poolPair.assetOut == this.id) {
      return this.calculateShares(poolPair, amountIn, fees);
    }

    return this.calculateOut(poolPair, amountIn, fees);
  }

  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber {
    const spot = StableMath.calculateSpotPriceWithFee(
      this.id,
      this.getReserves(),
      this.amplification,
      poolPair.assetIn,
      poolPair.assetOut,
      this.totalIssuance,
      '0',
      this.getPegs()
    );

    if (poolPair.assetIn == this.id) {
      return bnum(spot);
    }

    if (poolPair.assetOut == this.id) {
      const base = scale(ONE, poolPair.decimalsOut - poolPair.decimalsIn);
      return bnum(spot).div(base);
    }

    const base = scale(ONE, 18 - poolPair.decimalsOut);
    return bnum(spot).div(base);
  }

  calculateTradeFee(amount: BigNumber, fees: StableSwapFees): BigNumber {
    const fee = StableMath.calculatePoolTradeFee(
      amount.toString(),
      fees.fee[0],
      fees.fee[1]
    );
    return bnum(fee);
  }

  private getPegs(): string {
    return JSON.stringify(this.pegs);
  }

  private getReserves(): string {
    const reserves = this.tokens
      .filter((token) => token.id != this.id)
      .map(({ id, balance, decimals }: PoolToken) => {
        return {
          asset_id: Number(id),
          amount: balance,
          decimals: decimals,
        };
      });
    return JSON.stringify(reserves);
  }

  private getAssets(assetId: string, amount: BigNumber): string {
    const asset = {
      asset_id: Number(assetId),
      amount: amount.toFixed(0),
    };
    return JSON.stringify([asset]);
  }
}
