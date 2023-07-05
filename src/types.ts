import { BigNumber } from './utils/bignumber';

export type PoolAsset = { id: string; symbol: string };

export enum PoolType {
  XYK = 'XYK',
  LBP = 'LBP',
  Stable = 'Stable',
  Omni = 'Omni',
}

export enum PoolError {
  InsufficientTradingAmount = 'InsufficientTradingAmount',
  MaxInRatioExceeded = 'MaxInRatioExceeded',
  MaxOutRatioExceeded = 'MaxOutRatioExceeded',
}

export interface PoolPair {
  assetIn: string;
  assetOut: string;
  decimalsIn: number;
  decimalsOut: number;
  balanceIn: BigNumber;
  balanceOut: BigNumber;
}

export type PoolBase = {
  address: string;
  type: PoolType;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
};

export type PoolLimits = Pick<PoolBase, 'maxInRatio' | 'maxOutRatio' | 'minTradingLimit'>;

export type PoolFee = [numerator: number, denominator: number];

export type PoolToken = PoolAsset & {
  balance: string;
  decimals: number;
};

export type PoolSell = {
  calculatedOut: BigNumber;
};

export type PoolBuy = {
  calculatedIn: BigNumber;
};

export type Transfer = {
  amountIn: BigNumber;
  amountOut: BigNumber;
  feePct: number;
  errors: PoolError[];
};

export type SellTransfer = Transfer & PoolSell;
export type BuyTransfer = Transfer & PoolBuy;

export interface Pool extends PoolBase {
  validatePair(tokenIn: string, tokenOut: string): boolean;
  parsePair(tokenIn: string, tokenOut: string): PoolPair;
  validateAndBuy(poolPair: PoolPair, amountOut: BigNumber): BuyTransfer;
  validateAndSell(poolPair: PoolPair, amountOut: BigNumber): SellTransfer;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber, applyFee: boolean): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber, applyFee: boolean): BigNumber;
  spotPriceInGivenOut(poolPair: PoolPair): BigNumber;
  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber;
}

export interface IPoolService {
  getPools(includeOnly?: PoolType[]): Promise<PoolBase[]>;
  buildBuyTx(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber,
    maxAmountIn: BigNumber,
    route: Hop[]
  ): Transaction;
  buildSellTx(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber,
    minAmountOut: BigNumber,
    route: Hop[]
  ): Transaction;
}

export interface Transaction {
  hex: string;
  name?: string;
  get<T>(): T;
}

export type Hop = {
  poolType: PoolType;
  poolId: string;
  assetIn: string;
  assetOut: string;
};

export type Swap = Hop &
  Humanizer & {
    assetInDecimals: number;
    assetOutDecimals: number;
    amountIn: BigNumber;
    amountOut: BigNumber;
    spotPrice: BigNumber;
    tradeFeePct: number;
    priceImpactPct: number;
    errors: PoolError[];
  };

export type SellSwap = Swap & PoolSell;
export type BuySwap = Swap & PoolBuy;

export enum TradeType {
  Buy = 'Buy',
  Sell = 'Sell',
}

export interface Trade extends Humanizer {
  type: TradeType;
  amountIn: BigNumber;
  amountOut: BigNumber;
  spotPrice: BigNumber;
  tradeFee: BigNumber;
  tradeFeePct: number;
  priceImpactPct: number;
  swaps: Swap[];
  toTx(tradeLimit: BigNumber): Transaction;
}

export interface Humanizer {
  toHuman(): any;
}

export type Amount = {
  amount: BigNumber;
  decimals: number;
};

export interface AssetBalance {
  free: BigNumber;
  locked: BigNumber;
  reserved: BigNumber;
  available: BigNumber;
}

export interface AssetMetadata {
  symbol: string;
  decimals: number;
}

export interface AssetDetail {
  name: string;
  existentialDeposit: string;
}
