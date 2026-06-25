import { Asset } from '../asset';
import { Dex } from './dex';

import type { BalanceConfigBuilder } from '../config/definition/balance';
import type { MinConfigBuilder } from '../config/definition/min';

export type ChainAssetId =
  | string
  | number
  | bigint
  | { [key: string]: ChainAssetId };

export type ChainCurrency = {
  asset: Asset;
  decimals: number;
};

export enum ChainEcosystem {
  Ethereum = 'Ethereum',
  Polkadot = 'Polkadot',
  Kusama = 'Kusama',
  Solana = 'Solana',
  Sui = 'Sui',
}

export type ChainRpcs = {
  http: string[];
  webSocket: string[];
};

export enum ChainType {
  'Parachain' = 'parachain',
  'EvmParachain' = 'evm-parachain',
  'EvmChain' = 'evm-chain',
  'SolanaChain' = 'solana-chain',
  'SuiChain' = 'sui-chain',
}

/**
 * Chain Asset Data
 *
 * @interface ChainAssetData
 * @member {Asset} asset asset key & symbol
 * @member {number} decimals asset decimals
 * @member {ChainAssetId} id asset internal id
 * @member {ChainAssetId} balanceId asset id to query balance (if other than internal)
 * @member {AssetAmount} min asset minimal deposit
 */
export interface ChainAssetData {
  asset: Asset;
  balanceId?: ChainAssetId;
  decimals?: number;
  id?: ChainAssetId;
  min?: number;
}

export interface ChainParams<T extends ChainAssetData> {
  assetsData: T[];
  /**
   * Default balance storage builder for assets on this chain. Per-asset
   * outliers are declared via {@link balanceOverrides}.
   */
  balance: BalanceConfigBuilder;
  balanceOverrides?: Record<string /* asset.key */, BalanceConfigBuilder>;
  ecosystem?: ChainEcosystem;
  explorer?: string;
  isTestChain?: boolean;
  key: string;
  /**
   * Dynamic minimum storage builder (e.g. AssetHub `assets.asset`). Optional —
   * chains with static minimums rely on `assetsData[*].min` instead.
   */
  min?: MinConfigBuilder;
  name: string;
}

export abstract class Chain<T extends ChainAssetData> {
  readonly assetsData: Map<string, T>;

  readonly balance: BalanceConfigBuilder;

  readonly balanceOverrides?: Record<string, BalanceConfigBuilder>;

  readonly ecosystem?: ChainEcosystem;

  readonly explorer?: string;

  readonly isTestChain: boolean;

  readonly key: string;

  readonly min?: MinConfigBuilder;

  readonly name: string;

  private _dex?: Dex;

  constructor({
    assetsData,
    balance,
    balanceOverrides,
    ecosystem,
    explorer,
    isTestChain = false,
    key,
    min,
    name,
  }: ChainParams<T>) {
    this.assetsData = new Map(assetsData.map((data) => [data.asset.key, data]));
    this.balance = balance;
    this.balanceOverrides = balanceOverrides;
    this.ecosystem = ecosystem;
    this.explorer = explorer;
    this.isTestChain = isTestChain;
    this.key = key;
    this.min = min;
    this.name = name;
  }

  abstract getType(): ChainType;
  abstract getCurrency(): Promise<ChainCurrency>;

  get dex(): Dex {
    if (!this._dex) {
      throw new Error(`No DEX attached to chain ${this.key}`);
    }
    return this._dex;
  }

  registerDex(dex: Dex): this {
    this._dex = dex;
    return this;
  }

  isSubstrate(): boolean {
    return (
      this.getType() === ChainType.Parachain ||
      this.getType() === ChainType.EvmParachain
    );
  }

  isEvm(): boolean {
    return (
      this.getType() === ChainType.EvmChain ||
      this.getType() === ChainType.EvmParachain
    );
  }

  isSolana(): boolean {
    return this.getType() === ChainType.SolanaChain;
  }

  isSui(): boolean {
    return this.getType() === ChainType.SuiChain;
  }

  isEvmChain(): boolean {
    return this.getType() === ChainType.EvmChain;
  }

  isEvmParachain(): boolean {
    return this.getType() === ChainType.EvmParachain;
  }

  isParachain(): boolean {
    return this.getType() === ChainType.Parachain;
  }

  getAsset(key: string): Asset | undefined {
    return this.assetsData.get(key)?.asset;
  }

  getAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.id ?? asset.originSymbol;
  }

  getAssetDecimals(asset: Asset): number | undefined {
    return this.assetsData.get(asset.key)?.decimals;
  }

  getAssetMin(asset: Asset): number {
    return this.assetsData.get(asset.key)?.min ?? 0;
  }

  getBalanceAssetId(asset: Asset): ChainAssetId {
    return this.assetsData.get(asset.key)?.balanceId ?? this.getAssetId(asset);
  }

  /**
   * Balance storage builder for a given asset — per-asset override if one is
   * registered, otherwise the chain default.
   */
  getBalanceBuilder(asset: Asset): BalanceConfigBuilder {
    return this.balanceOverrides?.[asset.key] ?? this.balance;
  }

  /**
   * Dynamic minimum storage builder for this chain (shared across assets), or
   * undefined when the chain uses static `assetsData[*].min` values.
   */
  getMinBuilder(): MinConfigBuilder | undefined {
    return this.min;
  }

  updateAsset(asset: T): void {
    this.assetsData.set(asset.asset.key, asset);
  }
}
