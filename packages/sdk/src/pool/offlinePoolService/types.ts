import { Asset } from '../../types';
import { PoolBase, PoolToken, PoolType } from '../types';
import { LbpPoolBase } from '../lbp';
import { StableSwapBase } from '../stable';
import { OmniPoolBase } from '../omni';

export enum AssetType {
  Bond = 'Bond',
  External = 'External',
  StableSwap = 'StableSwap',
  Token = 'Token',
  XYK = 'XYK',
  Erc20 = 'Erc20',
  PoolShare = 'PoolShare',
}

export type AssetDynamicFee = {
  assetFee: number;
  protocolFee: number;
  timestamp: number;
};

export interface PersistentAsset extends Partial<Asset> {
  id: string;
  decimals: number;
  symbol: string;
  existentialDeposit: string;
  isSufficient: boolean;
  type: AssetType;
  dynamicFee?: AssetDynamicFee;
}

export interface IPersistentPoolToken extends Partial<PoolToken> {
  id: string;
  decimals: number;
  symbol: string;
  balance: string;
  existentialDeposit: string;
  isSufficient: boolean;
  type: AssetType;
  tradable?: number;
}

export interface IPersistentOmniPoolToken extends PersistentAsset {
  id: string;
  decimals: number;
  balance: string;
  tradable?: number;
  hubReserves: string;
  shares: string;
  cap: string;
  protocolShares: string;
}

export interface IPersistentPoolBase {
  address: string;
  id?: string;
  type: PoolType;
  tokens: IPersistentPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
}

export interface IPersistentLbpPoolBase {
  id?: string;
  address: string;
  type: PoolType;
  tokens: IPersistentPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  fee: number[];
  repayFeeApply: boolean;
  start: number;
  end: number;
  initialWeight: number;
  finalWeight: number;
  repayTarget: string;
  feeCollector: string;
  relayBlockNumber: number;
}

export interface IPersistentStableSwapBasePegSource {
  sourceKind: string;
  oracleName?: string;
  oraclePeriod?: string;
  oracleAsset?: string;
  valuePoints?: string[];
}

export interface IPersistentStableSwapBase {
  id: string;
  address: string;
  type: PoolType;
  tokens: IPersistentPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  initialAmplification: number;
  finalAmplification: number;
  initialBlock: number;
  finalBlock: number;
  blockNumber: number;
  fee: number;
  totalIssuance: string;
  pegs: string[][];
  pegsUpdatedAtParaBlock?: number;
  maxPegUpdate?: number;
  pegSources?: IPersistentStableSwapBasePegSource[];
}

export interface IPersistentOmniPoolBase {
  address: string;
  type: PoolType;
  tokens: IPersistentOmniPoolToken[];
  maxInRatio: number;
  maxOutRatio: number;
  minTradingLimit: number;
  hubAssetId: string;
}

export type PersistentDynamicFeesAssetFeeParams = {
  minFee: number;
  maxFee: number;
  decay: string;
  amplification: string;
};

export interface IPersistentConstants {
  lbpRepayFee: number[];
  lbpMaxInRatio: string;
  lbpMaxOutRatio: string;
  lbpMinPoolLiquidity: string;
  lbpMinTradingLimit: string;

  omnipoolBurnProtocolFee: number;
  omnipoolHdxAssetId: number;
  omnipoolHubAssetId: number;
  omnipoolMaxInRatio: string;
  omnipoolMaxOutRatio: string;
  omnipoolMinimumPoolLiquidity: string;
  omnipoolMinimumTradingLimit: string;
  omnipoolMinWithdrawalFee: number;

  stableswapMinTradingLimit: string;
  stableswapMinPoolLiquidity: string;
  stableswapAmplificationRange: number[];

  xykGetExchangeFee: number[];
  xykMaxInRatio: string;
  xykMaxOutRatio: string;
  xykMinPoolLiquidity: string;
  xykMinTradingLimit: string;
  xykNativeAssetId: number;
  xykOracleSource: string;

  dynamicFeesAssetFeeParameters: PersistentDynamicFeesAssetFeeParams;
  dynamicFeesProtocolFeeParameters: PersistentDynamicFeesAssetFeeParams;
}

export type EmaOracleSource = string;

export type EmaOraclePeriod = string;

export interface IPersistentEmaOracleEntry {
  source: EmaOracleSource;
  period: EmaOraclePeriod;
  assets: string[];
  entry: IPersistentEmaOracleEntryData;
}
export interface IPersistentEmaOracleEntryData {
  price: IPersistentEmaOracleEntryRatio;
  volume: IPersistentEmaOracleEntryVolume;
  liquidity: IPersistentEmaOracleEntryLiquidity;
  updatedAt: number;
}

export interface IPersistentEmaOracleEntryLiquidity {
  a: string;
  b: string;
}

export interface IPersistentEmaOracleEntryVolume {
  aIn: string;
  bOut: string;
  aOut: string;
  bIn: string;
}

export interface IPersistentEmaOracleEntryRatio {
  n: string;
  d: string;
}

export interface IPersistentMmOracleEntry {
  address: string;
  price: string;
  decimals: number;
  updatedAt: number;
}

export interface IPersistentDataInput {
  assets: Array<PersistentAsset>;
  pools: {
    lbp: Array<IPersistentLbpPoolBase>;
    xyk: Array<IPersistentPoolBase>;
    stableswap: Array<IPersistentStableSwapBase>;
    omnipool: Array<IPersistentOmniPoolBase>;
    aave: Array<IPersistentPoolBase>;
  };
  constants: IPersistentConstants;
  emaOracle: Array<IPersistentEmaOracleEntry>;
  mmOracle: Array<IPersistentMmOracleEntry>;
  meta: IPersistentMetaData;
}

export interface IOfflinePoolServiceDataSource {
  assets: Array<PersistentAsset>;
  pools: {
    lbp: Array<LbpPoolBase>;
    xyk: Array<PoolBase>;
    stableswap: Array<StableSwapBase>;
    omnipool: Array<OmniPoolBase>;
    aave: Array<PoolBase>;
  };
  constants: IPersistentConstants;
  emaOracle: Array<IPersistentEmaOracleEntry>;
  mmOracle: Array<IPersistentMmOracleEntry>;
  meta: IPersistentMetaData;
}

export interface IPersistentMetaData {
  paraBlockNumber: number;
  paraBlockHash: string;
  relayBlockNumber: number;
}
