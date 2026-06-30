import { encodeAssetId, encodeLocation } from '@galacticcouncil/common';

import {
  catchError,
  concatMap,
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
  BigInt(response?.min_balance?.toString() ?? '0');

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
