import { log, rx } from '@galacticcouncil/common';

import { catchError, combineLatest, map, of, retry, Observable } from 'rxjs';

import { Asset, AssetAmount } from '../asset';
import { BalanceType } from './balance';
import { Dex } from './dex';

const { logger } = log;

/** Attempts to recover a dropped balance stream before giving up on it. */
const BALANCE_RETRY = { count: 3, delay: 1000 };

/** Window used to coalesce the update burst that follows a balance change. */
const BALANCE_DEBOUNCE = 500;

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

export interface ChainParams<
  T extends ChainAssetData,
  B extends BalanceType = BalanceType,
> {
  assetsData: T[];
  /**
   * Default balance storage type for assets on this chain. Per-asset outliers
   * are declared via {@link balanceOverrides}. Typed per platform — a chain
   * can only declare storage types its own balance client supports.
   *
   * `NoInfer` keeps `B` pinned to each chain's declared balance type instead of
   * being widened to whatever is passed, so e.g. `new Parachain` rejects evm/sui
   * storage types rather than silently inferring them.
   */
  balance: NoInfer<B>;
  balanceOverrides?: Record<string, NoInfer<B>>;
  ecosystem?: ChainEcosystem;
  explorer?: string;
  isTestChain?: boolean;
  key: string;
  name: string;
}

export abstract class Chain<
  T extends ChainAssetData,
  B extends BalanceType = BalanceType,
> {
  readonly assetsData: Map<string, T>;

  readonly balance: B;

  readonly balanceOverrides?: Record<string, B>;

  readonly ecosystem?: ChainEcosystem;

  readonly explorer?: string;

  readonly isTestChain: boolean;

  readonly key: string;

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
    name,
  }: ChainParams<T, B>) {
    this.assetsData = new Map(assetsData.map((data) => [data.asset.key, data]));
    this.balance = balance;
    this.balanceOverrides = balanceOverrides;
    this.ecosystem = ecosystem;
    this.explorer = explorer;
    this.isTestChain = isTestChain;
    this.key = key;
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

  /** Every asset configured on this chain, regardless of route direction. */
  getAssets(): Asset[] {
    return [...this.assetsData.values()].map((data) => data.asset);
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
   * Balance storage type for a given asset — per-asset override if one is
   * registered, otherwise the chain default.
   */
  getBalanceType(asset: Asset): B {
    return this.balanceOverrides?.[asset.key] ?? this.balance;
  }

  /**
   * Read an asset's balance for `address` directly from this chain — no
   * transfer, route, wallet or platform adapter required. Implemented per
   * platform.
   */
  abstract getBalance(asset: Asset, address: string): Promise<AssetAmount>;

  /**
   * One-shot balances for many assets. Reads each asset independently so one
   * failing asset can't blank the snapshot — platforms that can serve the set
   * in a single read override this.
   */
  async getBalances(assets: Asset[], address: string): Promise<AssetAmount[]> {
    const results = await Promise.allSettled(
      assets.map((asset) => this.getBalance(asset, address))
    );

    return results.flatMap((result, i) => {
      if (result.status === 'fulfilled') {
        return [result.value];
      }
      logger.warn(`Balance fetch failed for ${assets[i].key}:`, result.reason);
      return [];
    });
  }

  /**
   * Reactive balance for a single asset. Implemented per platform.
   */
  abstract subscribeBalance(
    asset: Asset,
    address: string
  ): Observable<AssetAmount>;

  /**
   * Reactive composite balance — merges the per-asset streams into one,
   * emitting the full set on any change. The building block for multi-token
   * and (by merging chains) multi-chain balance feeds.
   *
   * Failed assets are warned and omitted, so an emission may be shorter than
   * `assets` and must be matched by key, not by index.
   */
  subscribeBalances(
    assets: Asset[],
    address: string
  ): Observable<AssetAmount[]> {
    if (!assets.length) {
      return of([]);
    }

    return this.debounceBalances(
      combineLatest(
        assets.map((asset) =>
          this.isolateBalances(
            this.subscribeBalance(asset, address).pipe(map((b) => [b])),
            asset.key
          )
        )
      ).pipe(map((groups) => groups.flat()))
    );
  }

  /** The SDK-wide coalescing policy for composite balance streams. */
  protected debounceBalances(
    balances: Observable<AssetAmount[]>
  ): Observable<AssetAmount[]> {
    return balances.pipe(rx.debounceAfterFirst(BALANCE_DEBOUNCE));
  }

  /**
   * Resubscribe on error, then warn and omit once the retries are spent —
   * mirroring {@link getBalances}. Without this a single dead stream errors the
   * composite and takes every other asset on the chain down with it.
   *
   * Retrying requires the source to rebuild its watcher on resubscribe, which
   * is why the platform clients defer theirs.
   */
  protected isolateBalances(
    balances: Observable<AssetAmount[]>,
    label: string
  ): Observable<AssetAmount[]> {
    return balances.pipe(
      retry(BALANCE_RETRY),
      catchError((err) => {
        logger.warn(`Balance subscription failed for ${label}:`, err);
        return of([]);
      })
    );
  }

  protected async resolveDecimals(asset: Asset): Promise<number> {
    const decimals = this.getAssetDecimals(asset);
    if (decimals) {
      return decimals;
    }
    const currency = await this.getCurrency();
    return currency.decimals;
  }

  updateAsset(asset: T): void {
    this.assetsData.set(asset.asset.key, asset);
  }
}
