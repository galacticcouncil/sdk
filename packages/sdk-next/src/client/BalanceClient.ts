import { PolkadotClient } from 'polkadot-api';

import {
  type Observable,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
} from 'rxjs';

import { Papi } from '../api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetNotFound } from '../errors';
import { AssetAmount } from '../types';

export class BalanceClient extends Papi {
  constructor(client: PolkadotClient) {
    super(client);
  }

  async getBalance(account: string, assetId: number): Promise<bigint> {
    const query = this.api.query.AssetRegistry.Assets;
    const asset = await query.getValue(assetId);

    if (!asset) throw new AssetNotFound(assetId);

    if (asset.asset_type.type === 'Erc20') {
      return this.getErc20Balance(account, assetId);
    }

    return assetId === SYSTEM_ASSET_ID
      ? this.getSystemBalance(account)
      : this.getTokenBalance(account, assetId);
  }

  async getSystemBalance(account: string): Promise<bigint> {
    const query = this.api.query.System.Account;
    const {
      data: { free, frozen },
    } = await query.getValue(account);
    return free - frozen;
  }

  async getTokenBalance(account: string, assetId: number): Promise<bigint> {
    const query = this.api.query.Tokens.Accounts;
    const { free, frozen } = await query.getValue(account, assetId);
    return free - frozen;
  }

  async getErc20Balance(account: string, assetId: number): Promise<bigint> {
    return this.getTokenBalanceData(account, assetId);
  }

  subscribeBalance(address: string): Observable<AssetAmount[]> {
    const systemOb = this.subscribeSystemBalance(address);
    const tokensOb = this.subscribeTokensBalance(address);

    return combineLatest([systemOb, tokensOb]).pipe(
      debounceTime(250),
      map((balance) => balance.flat())
    );
  }

  // TODO: Impl proper balance check
  subscribeErc20Balance(address: string): Observable<string> {
    return this.api.event.EVM.Log.watch().pipe(
      map(({ meta, payload }) => {
        console.log(meta);
        console.log(payload);
        return 'yes';
      })
    );
  }

  subscribeSystemBalance(address: string): Observable<AssetAmount> {
    const query = this.api.query.System.Account;

    return query.watchValue(address, 'best').pipe(
      map((balance) => {
        const { free, frozen } = balance.data;
        this.logSync(address, 'system balance', free - frozen);
        return {
          id: SYSTEM_ASSET_ID,
          amount: free - frozen,
        } as AssetAmount;
      })
    );
  }

  subscribeTokenBalance(
    address: string,
    assetId: number
  ): Observable<AssetAmount> {
    const query = this.api.query.Tokens.Accounts;

    return query.watchValue(address, assetId, 'best').pipe(
      map((balance) => {
        const { free, frozen } = balance;
        this.logSync(address, 'token balance', free - frozen);
        return {
          id: assetId,
          amount: free - frozen,
        } as AssetAmount;
      })
    );
  }

  subscribeTokensBalance(address: string): Observable<AssetAmount[]> {
    const query = this.api.query.Tokens.Accounts;

    return query.watchEntries(address, { at: 'best' }).pipe(
      distinctUntilChanged((_, current) => !current.deltas),
      map(({ entries, deltas }) => {
        const delta = deltas?.upserted.map((up) => up.args[1]).sort();
        this.logSync(address, 'tokens balance', delta);
        const result: AssetAmount[] = [];
        entries.forEach((e) => {
          const [_, asset] = e.args;
          const { free, frozen } = e.value;
          result.push({
            id: asset,
            amount: free - frozen,
          });
        });
        return result;
      })
    );
  }

  private async getTokenBalanceData(
    account: string,
    assetId: number
  ): Promise<bigint> {
    const { free, frozen } = await this.api.apis.CurrenciesApi.account(
      assetId,
      account
    );
    return free - frozen;
  }
}
