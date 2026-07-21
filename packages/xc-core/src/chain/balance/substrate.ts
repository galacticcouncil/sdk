import {
  changedEntries,
  encodeAssetId,
  encodeLocation,
} from '@galacticcouncil/common';

import {
  catchError,
  concatMap,
  defer,
  distinctUntilChanged,
  firstValueFrom,
  map,
  throwError,
  Observable,
} from 'rxjs';

import { Asset, AssetAmount } from '../../asset';

import { normalizeAssetAmount } from './utils';
import { SubstrateMinType, SubstrateBalanceType } from './types';

import type { AnyParachain } from '../types';

type StorageEntry = {
  module: string;
  func: string;
  args: any[];
  extract: (response: any) => bigint;
};

type WatchValueEmission<T = any> = { value: T };

const freeMinusFrozen = (response: any): bigint => {
  const free = BigInt(response?.free?.toString() ?? '0');
  const frozen = BigInt(response?.frozen?.toString() ?? '0');
  return free >= frozen ? free - frozen : 0n;
};

const systemFreeMinusFrozen = (response: any): bigint => {
  const data = response?.data;
  const free = BigInt(data?.free?.toString() ?? '0');
  const frozen = BigInt((data?.miscFrozen ?? data?.frozen)?.toString() ?? '0');
  return free >= frozen ? free - frozen : 0n;
};

const balanceField = (response: any): bigint =>
  BigInt(response?.balance?.toString() ?? '0');

const minBalanceField = (response: any): bigint =>
  BigInt(response?.minBalance?.toString() ?? '0');

/**
 * Storage maps keyed (account, asset) — i.e. account first, so the account can
 * be used as a partial key to read every asset it holds in one go. The other
 * balance types are keyed asset first and have no such prefix.
 */
const ACCOUNT_KEYED: Partial<Record<SubstrateBalanceType, string>> = {
  [SubstrateBalanceType.Tokens]: 'Tokens',
  [SubstrateBalanceType.OrmlTokens]: 'OrmlTokens',
};

/**
 * Reads substrate balances (and dynamic minimums) from a parachain's papi
 * client. Owned by {@link Parachain}.
 */
export class SubstrateBalanceClient {
  constructor(private readonly chain: AnyParachain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: SubstrateBalanceType
  ): Promise<AssetAmount> {
    return firstValueFrom(this.subscribe(asset, account, type));
  }

  subscribe(
    asset: Asset,
    account: string,
    type: SubstrateBalanceType
  ): Observable<AssetAmount> {
    const { module, func, args, extract } = this.entry(asset, account, type);
    const fn = this.chain.client.getUnsafeApi().query[module][func];

    return fn.watchValue(...args, { at: 'best' }).pipe(
      map(({ value }: WatchValueEmission) => extract(value)),
      distinctUntilChanged((prev: bigint, curr: bigint) => prev === curr),
      concatMap(async (amount: bigint) => {
        const params = await normalizeAssetAmount(amount, asset, this.chain);
        return AssetAmount.fromAsset(asset, params);
      }),
      catchError((err) => {
        console.error('subscribe fails for:', asset);
        return throwError(() => err);
      })
    );
  }

  /**
   * Whether {@link subscribeMany} can serve this asset.
   *
   * Requires an account-keyed map and a numeric balance id. The numeric check
   * excludes evm addresses — the one case where {@link EvmParachain} keys
   * balances by a derived account rather than the address passed in.
   */
  supportsMany(asset: Asset, type: SubstrateBalanceType): boolean {
    if (!ACCOUNT_KEYED[type]) {
      return false;
    }
    const id = this.chain.getBalanceAssetId(asset);
    return typeof id === 'number' || typeof id === 'bigint';
  }

  /**
   * Live balances for many assets on a single subscription.
   *
   * papi takes the account as a partial key, so one `watchEntries` covers
   * every asset the account holds in that map — a chain with N tokens costs
   * one subscription instead of N.
   */
  subscribeMany(
    assets: Asset[],
    account: string,
    type: SubstrateBalanceType
  ): Observable<AssetAmount[]> {
    const module = this.manyModule(type);

    return defer(() => {
      const fn = this.chain.client.getUnsafeApi().query[module].Accounts;
      return fn.watchEntries(account, { at: 'best' });
    }).pipe(
      changedEntries(),
      concatMap(({ entries }: any) => this.joinMany(assets, entries))
    );
  }

  /**
   * One-shot counterpart of {@link subscribeMany} — same partial key, so a
   * snapshot of N assets costs one storage read instead of N short-lived
   * subscriptions.
   */
  async getMany(
    assets: Asset[],
    account: string,
    type: SubstrateBalanceType
  ): Promise<AssetAmount[]> {
    const module = this.manyModule(type);
    const fn = this.chain.client.getUnsafeApi().query[module].Accounts;

    // Same key tuple as `watchEntries`, under a different field name.
    const entries = await fn.getEntries(account, { at: 'best' });
    return this.joinMany(
      assets,
      entries.map(({ keyArgs, value }: any) => ({ args: keyArgs, value }))
    );
  }

  private manyModule(type: SubstrateBalanceType): string {
    const module = ACCOUNT_KEYED[type];
    if (!module) {
      throw new Error('Unsupported substrate batch balance type: ' + type);
    }
    return module;
  }

  /**
   * Joins decoded entries onto the requested assets. The account is a partial
   * key, so `args[1]` is the asset id.
   */
  private joinMany(assets: Asset[], entries: any[]): Promise<AssetAmount[]> {
    const { chain } = this;
    const held = new Map<string, bigint>(
      entries.map(({ args, value }: any) => [
        args[1].toString(),
        freeMinusFrozen(value),
      ])
    );

    return Promise.all(
      assets.map(async (asset) => {
        // Only existing keys come back, so a never-held asset is absent
        // rather than zero. It still has to emit, or the caller's
        // combineLatest never receives a first value.
        const id = chain.getBalanceAssetId(asset).toString();
        const params = await normalizeAssetAmount(
          held.get(id) ?? 0n,
          asset,
          chain
        );
        return AssetAmount.fromAsset(asset, params);
      })
    );
  }

  async getMin(asset: Asset, type: SubstrateMinType): Promise<AssetAmount> {
    const { module, func, args, extract } = this.minEntry(asset, type);
    const fn = this.chain.client.getUnsafeApi().query[module][func];
    const value = await fn.getValue(...args, { at: 'best' });
    const params = await normalizeAssetAmount(
      extract(value),
      asset,
      this.chain
    );
    return AssetAmount.fromAsset(asset, params);
  }

  async getEd(): Promise<AssetAmount> {
    let ed: bigint;
    try {
      const result = await this.chain.client
        .getUnsafeApi()
        .constants.Balances.ExistentialDeposit();
      ed = typeof result === 'bigint' ? result : BigInt(String(result));
    } catch {
      ed = 0n;
    }
    const { asset, decimals } = await this.chain.getCurrency();
    return AssetAmount.fromAsset(asset, { amount: ed, decimals });
  }

  private entry(
    asset: Asset,
    account: string,
    type: SubstrateBalanceType
  ): StorageEntry {
    const { chain } = this;
    switch (type) {
      case SubstrateBalanceType.System:
        return {
          module: 'System',
          func: 'Account',
          args: [account],
          extract: systemFreeMinusFrozen,
        };
      case SubstrateBalanceType.Tokens:
        return {
          module: 'Tokens',
          func: 'Accounts',
          args: [account, encodeAssetId(chain.getBalanceAssetId(asset))],
          extract: freeMinusFrozen,
        };
      case SubstrateBalanceType.OrmlTokens:
        return {
          module: 'OrmlTokens',
          func: 'Accounts',
          args: [account, encodeAssetId(chain.getBalanceAssetId(asset))],
          extract: freeMinusFrozen,
        };
      case SubstrateBalanceType.Assets:
        return {
          module: 'Assets',
          func: 'Account',
          args: [encodeAssetId(chain.getBalanceAssetId(asset)), account],
          extract: balanceField,
        };
      case SubstrateBalanceType.ForeignAssets: {
        const location = chain.getAssetXcmLocation(asset);
        if (!location) {
          throw new Error('Missing asset xcm location for ' + asset.key);
        }
        return {
          module: 'ForeignAssets',
          func: 'Account',
          args: [encodeLocation(location), account],
          extract: balanceField,
        };
      }
      default:
        throw new Error('Unsupported substrate balance type: ' + type);
    }
  }

  private minEntry(asset: Asset, type: SubstrateMinType): StorageEntry {
    switch (type) {
      case SubstrateMinType.Assets:
        return {
          module: 'Assets',
          func: 'Asset',
          args: [this.chain.getMinAssetId(asset)],
          extract: minBalanceField,
        };
      default:
        throw new Error('Unsupported substrate min type: ' + type);
    }
  }
}
