import type { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { ApiPromise, ApiRx } from '@polkadot/api';
import { Storage } from '../../storage';
import { AssetBalance } from '../../types';
import { bnum, ZERO } from '../../utils/bignumber';
import { Observable, map } from 'rxjs';
import { ChainAsset } from '../../registry';
import { NativeBalanceAdapter } from './NativeBalanceAdapter';

const createBalanceStorages = (api: ApiPromise | ApiRx) => {
  return {
    balances: (address: string) =>
      Storage.create<DeriveBalancesAll>({
        api,
        path: 'derive.balances.all',
        params: [address],
      }),
    tokens: (tokenId: string, address: string) =>
      Storage.create<any>({
        api,
        path: 'query.tokens.accounts',
        params: [address, tokenId],
      }),
  };
};

export class TokenBalanceAdapter extends NativeBalanceAdapter {
  private storages: ReturnType<typeof createBalanceStorages>;

  constructor(api: ApiPromise | ApiRx) {
    super(api);
    this.storages = createBalanceStorages(api);
  }

  public getObserver(asset: ChainAsset, address: string): Observable<AssetBalance> {
    if (asset.symbol === this.nativeToken) {
      return this.getSystemAccountBalanceObserver(address);
    }
    return this.getTokenAccountBalanceObserver(asset, address);
  }

  private getSystemAccountBalanceObserver(address: string): Observable<AssetBalance> {
    const balances = this.storages.balances(address);
    return balances.observable.pipe(
      map((data) => ({
        free: bnum(data.freeBalance.toString()),
        locked: bnum(data.lockedBalance.toString()),
        reserved: bnum(data.reservedBalance.toString()),
        available: bnum(data.availableBalance.toString()),
      }))
    );
  }

  private getTokenAccountBalanceObserver(asset: ChainAsset, address: string): Observable<AssetBalance> {
    const tokens = this.storages.tokens(asset.asset.Token, address);
    return tokens.observable.pipe(
      map((balance) => {
        const balanceBN = bnum(balance.free?.toString() || '0');
        return {
          free: balanceBN,
          locked: ZERO,
          reserved: ZERO,
          available: balanceBN,
        };
      })
    );
  }
}
