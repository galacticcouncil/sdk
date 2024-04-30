import { BigNumber } from './utils/bignumber';

export enum PoolType {
  XYK = 'Xyk',
  LBP = 'Lbp',
  Stable = 'Stableswap',
  Omni = 'Omnipool',
}

export enum PoolError {
  UnknownError = 'UnknownError',
  InsufficientTradingAmount = 'InsufficientTradingAmount',
  MaxInRatioExceeded = 'MaxInRatioExceeded',
  MaxOutRatioExceeded = 'MaxOutRatioExceeded',
  TradeNotAllowed = 'TradeNotAllowed',
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
  id?: string;
  type: PoolType;
  tokens: PoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
};

export interface PoolToken extends Asset {
  id: string;
  balance: string;
  tradeable?: number;
}

export type PoolLimits = Pick<
  PoolBase,
  'maxInRatio' | 'maxOutRatio' | 'minTradingLimit'
>;

export type PoolFee = [numerator: number, denominator: number];

// Pool fee marker interface
export type PoolFees = {
  min?: PoolFee;
  max?: PoolFee;
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
  validateAndBuy(
    poolPair: PoolPair,
    amountOut: BigNumber,
    dynamicFees: PoolFees | null
  ): BuyTransfer;
  validateAndSell(
    poolPair: PoolPair,
    amountOut: BigNumber,
    dynamicFees: PoolFees | null
  ): SellTransfer;
  calculateInGivenOut(poolPair: PoolPair, amountOut: BigNumber): BigNumber;
  calculateOutGivenIn(poolPair: PoolPair, amountIn: BigNumber): BigNumber;
  spotPriceInGivenOut(poolPair: PoolPair): BigNumber;
  spotPriceOutGivenIn(poolPair: PoolPair): BigNumber;
}

export interface IPoolService {
  getPools(includeOnly?: PoolType[]): Promise<PoolBase[]>;
  getPoolFees(feeAsset: string, pool: Pool): Promise<PoolFees>;
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
  pool: PoolType;
  poolAddress: string;
  poolId?: string;
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
    tradeFeeRange?: [number, number];
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

export interface Asset extends AssetMetadata {
  id: string;
  name: string;
  icon: string;
  type: string;
  existentialDeposit: string;
  isSufficient: boolean;
  origin?: number;
  meta?: Record<string, string>;
}

export interface ExternalAsset extends AssetMetadata {
  id: string;
  origin: number;
  name: string;
  internalId: string;
}

export interface AssetMetadata {
  decimals: number;
  symbol: string;
}
