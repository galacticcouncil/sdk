import { PolkadotClient } from 'polkadot-api';

import {
  type Observable,
  Subject,
  bufferCount,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  pairwise,
  shareReplay,
  startWith,
} from 'rxjs';

import { Papi } from '../api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetAmount } from '../types';

export class BalanceClient extends Papi {
  constructor(client: PolkadotClient) {
    super(client);
  }

  async getBalance(account: string, assetId: number): Promise<bigint> {
    return assetId === SYSTEM_ASSET_ID
      ? this.getSystemBalance(account)
      : this.getTokenBalanceData(account, assetId);
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
    const erc20Ob = this.subscribeErc20Balance(address);

    return combineLatest([systemOb, tokensOb, erc20Ob]).pipe(
      debounceTime(250),
      map((balance) => balance.flat()),
      startWith([]), // trigger synthetic empty "previous"
      bufferCount(2, 1), // like pairwise, but includes the first
      map(([prev, curr], i) => {
        if (i === 0) return curr;
        const m = prev.reduce((acc, o) => {
          acc.set(o.id, o.amount);
          return acc;
        }, new Map<number, bigint>());
        const delta = curr.filter((a) => a.amount !== m.get(a.id));
        return delta;
      })
    );
  }

  subscribeSystemBalance(address: string): Observable<AssetAmount> {
    const query = this.api.query.System.Account;

    return query.watchValue(address, 'best').pipe(
      map((balance) => {
        const { free, frozen } = balance.data;
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
      map(({ deltas }) => {
        const result: AssetAmount[] = [];

        deltas?.deleted.forEach((u) => {
          const [_, asset] = u.args;
          result.push({
            id: asset,
            amount: 0n,
          });
        });

        deltas?.upserted.forEach((u) => {
          const [_, asset] = u.args;
          const { free, frozen } = u.value;
          result.push({
            id: asset,
            amount: free - frozen,
          });
        });

        return result;
      })
    );
  }

  subscribeErc20Balance(
    address: string,
    includeOnly?: number[]
  ): Observable<AssetAmount[]> {
    const subject = new Subject<AssetAmount[]>();
    const observable = subject.pipe(shareReplay(1));

    const getErc20s = async () => {
      const assets = await this.api.query.AssetRegistry.Assets.getEntries();
      return assets
        .filter(({ value }) => {
          const { asset_type } = value;
          return asset_type.type === 'Erc20';
        })
        .map(({ keyArgs }) => {
          const [id] = keyArgs;
          return id;
        });
    };

    const run = async () => {
      const ids = includeOnly ? includeOnly : await getErc20s();
      const updateBalance = async () => {
        const balances: [number, bigint][] = await Promise.all(
          ids.map(async (id) => {
            const balance = await this.getTokenBalanceData(address, id);
            return [id, balance];
          })
        );
        const balance = balances.map(([id, balance]) => {
          return {
            id: id,
            amount: balance,
          } as AssetAmount;
        });
        subject.next(balance);
      };

      await updateBalance();
      const sub =
        this.api.query.System.Number.watchValue('best').subscribe(
          updateBalance
        );
      return () => sub.unsubscribe();
    };

    let disconnect: () => void;
    run().then((unsub) => (disconnect = unsub));

    return observable.pipe(
      finalize(() => disconnect?.()),
      pairwise(),
      map(([prev, curr], i) => {
        if (i === 0) return curr;
        const m = prev.reduce((acc, o) => {
          acc.set(o.id, o.amount);
          return acc;
        }, new Map<number, bigint>());
        const delta = curr.filter((a) => a.amount !== m.get(a.id));
        return delta;
      }),
      distinctUntilChanged((_prev, curr) => curr.length === 0)
    ) as Observable<AssetAmount[]>;
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
