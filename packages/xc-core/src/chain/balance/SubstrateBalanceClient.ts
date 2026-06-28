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

import { normalizeAssetAmount } from './normalize';
import { BalanceType, MinType } from './types';

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

/**
 * Reads substrate balances (and dynamic minimums) from a parachain's papi
 * client. Owned by {@link Parachain}.
 */
export class SubstrateBalanceClient {
  constructor(private readonly chain: AnyParachain) {}

  async getBalance(
    asset: Asset,
    account: string,
    type: BalanceType
  ): Promise<AssetAmount> {
    return firstValueFrom(this.subscribe(asset, account, type));
  }

  subscribe(
    asset: Asset,
    account: string,
    type: BalanceType
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

  async getMin(asset: Asset, type: MinType): Promise<AssetAmount> {
    if (type !== MinType.Assets) {
      throw new Error('Unsupported min type: ' + type);
    }
    const fn = this.chain.client.getUnsafeApi().query.Assets.Asset;
    const response = await firstValueFrom(
      fn
        .watchValue(this.chain.getMinAssetId(asset), { at: 'best' })
        .pipe(map(({ value }: WatchValueEmission) => value))
    );
    const min = BigInt(response?.minBalance?.toString() ?? '0');
    const params = await normalizeAssetAmount(min, asset, this.chain);
    return AssetAmount.fromAsset(asset, params);
  }

  private entry(asset: Asset, account: string, type: BalanceType): StorageEntry {
    const { chain } = this;
    switch (type) {
      case BalanceType.System:
        return {
          module: 'System',
          func: 'Account',
          args: [account],
          extract: (response) => {
            const data = response?.data;
            const free = BigInt(data?.free?.toString() ?? '0');
            const frozen = BigInt(
              (data?.miscFrozen ?? data?.frozen)?.toString() ?? '0'
            );
            return free >= frozen ? free - frozen : 0n;
          },
        };
      case BalanceType.Tokens:
        return {
          module: 'Tokens',
          func: 'Accounts',
          args: [account, encodeAssetId(chain.getBalanceAssetId(asset))],
          extract: freeMinusFrozen,
        };
      case BalanceType.OrmlTokens:
        return {
          module: 'OrmlTokens',
          func: 'Accounts',
          args: [account, encodeAssetId(chain.getBalanceAssetId(asset))],
          extract: freeMinusFrozen,
        };
      case BalanceType.Assets:
        return {
          module: 'Assets',
          func: 'Account',
          args: [encodeAssetId(chain.getBalanceAssetId(asset)), account],
          extract: (response) => BigInt(response?.balance?.toString() ?? '0'),
        };
      case BalanceType.ForeignAssets: {
        const location = chain.getAssetXcmLocation(asset);
        if (!location) {
          throw new Error('Missing asset xcm location for ' + asset.key);
        }
        return {
          module: 'ForeignAssets',
          func: 'Account',
          args: [encodeLocation(location), account],
          extract: (response) => BigInt(response?.balance?.toString() ?? '0'),
        };
      }
      default:
        throw new Error('Unsupported substrate balance type: ' + type);
    }
  }
}
