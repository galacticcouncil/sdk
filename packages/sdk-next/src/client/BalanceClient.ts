import { PolkadotClient } from 'polkadot-api';

import { log } from '@galacticcouncil/common';
import { HydrationQueries } from '@galacticcouncil/descriptors';

import { type Observable, combineLatest, concat, defer, from } from 'rxjs';

import {
  bufferCount,
  distinctUntilChanged,
  debounceTime,
  map,
  pairwise,
  retry,
  startWith,
  switchMap,
  tap,
  take,
  skip,
  connect,
} from 'rxjs/operators';

import { Papi } from '../api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetBalance, Balance } from '../types';

type TSystemAccount = HydrationQueries['System']['Account']['Value'];
type TTokenAccount = HydrationQueries['Tokens']['Accounts']['Value'];
type TAccount = TSystemAccount['data'] | TTokenAccount;

const { logger } = log;

export class BalanceClient extends Papi {
  constructor(client: PolkadotClient) {
    super(client);
  }

  async getBalance(account: string, assetId: number): Promise<Balance> {
    return assetId === SYSTEM_ASSET_ID
      ? this.getSystemBalance(account)
      : this.getBalanceData(account, assetId);
  }

  async getSystemBalance(account: string): Promise<Balance> {
    const query = this.api.query.System.Account;
    const { data } = await query.getValue(account, { at: 'best' });
    return this.getBreakdown(data);
  }

  async getTokenBalance(account: string, assetId: number): Promise<Balance> {
    const query = this.api.query.Tokens.Accounts;
    const data = await query.getValue(account, assetId, { at: 'best' });
    return this.getBreakdown(data);
  }

  async getErc20Balance(account: string, assetId: number): Promise<Balance> {
    return this.getBalanceData(account, assetId);
  }

  watchBalance(address: string): Observable<AssetBalance[]> {
    return defer(() => {
      const systemOb = this.watchSystemBalance(address);
      const tokensOb = this.watchTokensBalance(address);
      const erc20Ob = this.watchErc20Balance(address);

      /**
       * First emission AS-IS, then debounced
       */
      return combineLatest([systemOb, tokensOb, erc20Ob]).pipe(
        connect((shared$) =>
          concat(
            shared$.pipe(take(1)),
            shared$.pipe(skip(1), debounceTime(250))
          )
        )
      );
    })
      .pipe(
        map((balance) => balance.flat()),
        /**
         * Trigger synthetic empty previous
         */
        startWith([] as AssetBalance[]),
        /**
         * Like pairwise, but includes first
         */
        bufferCount(2, 1),
        /**
         * First return all, then just deltas
         */
        map(([prev, curr], i) => {
          console.log('watchBalance', i, prev.length, curr.length);
          if (i === 0) return curr;
          return this.getDeltas(prev, curr);
        })
      )
      .pipe(
        tap({
          subscribe: () => logger.debug('balance: subscribe', address),
          error: (e) => logger.error('balance', e),
        }),
        retry({ delay: 1000 })
      );
  }

  watchSystemBalance(address: string): Observable<AssetBalance> {
    const query = this.api.query.System.Account;

    return defer(() => query.watchValue(address, 'best')).pipe(
      map(
        (balance) =>
          ({
            id: SYSTEM_ASSET_ID,
            balance: this.getBreakdown(balance.data),
          }) as AssetBalance
      ),
      tap({
        error: (e) => logger.error('balance(system)', e),
      })
    );
  }

  watchTokenBalance(
    address: string,
    assetId: number
  ): Observable<AssetBalance> {
    const query = this.api.query.Tokens.Accounts;

    return defer(() => query.watchValue(address, assetId, 'best')).pipe(
      map(
        (balance) =>
          ({
            id: assetId,
            balance: this.getBreakdown(balance),
          }) as AssetBalance
      ),
      tap({
        error: (e) => logger.error('balance(token)', e),
      })
    );
  }

  watchTokensBalance(address: string): Observable<AssetBalance[]> {
    const query = this.api.query.Tokens.Accounts;

    return defer(() => query.watchEntries(address, { at: 'best' })).pipe(
      /**
       * Don't emit if no deltas = no balance change
       */
      distinctUntilChanged((_, current) => !current.deltas),
      map(({ deltas }) => {
        const result: AssetBalance[] = [];

        deltas?.deleted.forEach((u) => {
          const [_, asset] = u.args;
          result.push({
            id: asset,
            balance: this.getBreakdown({
              free: 0n,
              reserved: 0n,
              frozen: 0n,
            }),
          });
        });

        deltas?.upserted.forEach((u) => {
          const [_, asset] = u.args;

          result.push({
            id: asset,
            balance: this.getBreakdown(u.value),
          });
        });
        return result;
      }),
      tap({
        error: (e) => logger.error('balance(tokens)', e),
      })
    );
  }

  watchErc20Balance(
    address: string,
    includeOnly?: number[]
  ): Observable<AssetBalance[]> {
    const getErc20s = async () => {
      const assets = await this.api.query.AssetRegistry.Assets.getEntries({
        at: 'best',
      });
      return assets
        .filter(({ value }) => value.asset_type.type === 'Erc20')
        .map(({ keyArgs }) => {
          const [id] = keyArgs;
          return id as number;
        });
    };

    const fetchBalance = async (ids: number[]) => {
      const balances: [number, Balance][] = await Promise.all(
        ids.map(
          async (id) => [id, await this.getBalanceData(address, id)] as const
        )
      );
      return balances.map(([id, balance]) => ({ id, balance }) as AssetBalance);
    };

    return defer(() =>
      from(includeOnly ? Promise.resolve(includeOnly) : getErc20s()).pipe(
        switchMap((ids) =>
          this.watcher.bestBlock$.pipe(
            startWith(null),
            switchMap(() => from(fetchBalance(ids)))
          )
        ),
        pairwise(),
        map(([prev, curr], i) => {
          if (i === 0) return curr.filter((a) => a.balance.transferable > 0n);
          return this.getDeltas(prev, curr);
        }),
        distinctUntilChanged((_prev, curr) => curr.length === 0),
        tap({
          error: (e) => logger.error('balance(erc20)', e),
        })
      )
    );
  }

  private async getBalanceData(
    account: string,
    assetId: number
  ): Promise<Balance> {
    const data = await this.api.apis.CurrenciesApi.account(assetId, account, {
      at: 'best',
    });
    return this.getBreakdown(data);
  }

  private getBreakdown(data: TAccount): Balance {
    const transferable =
      data.free >= data.frozen ? data.free - data.frozen : 0n;
    const total = data.free + data.reserved;

    return {
      free: data.free,
      reserved: data.reserved,
      frozen: data.frozen,
      total,
      transferable,
    };
  }

  getDeltas(prev: AssetBalance[], curr: AssetBalance[]): AssetBalance[] {
    const areBalancesEqual = (
      a: Balance | undefined,
      b: Balance | undefined
    ): boolean =>
      a !== undefined &&
      b !== undefined &&
      a.transferable === b.transferable &&
      a.total === b.total;

    const m = prev.reduce((acc, o) => {
      acc.set(o.id, o.balance);
      return acc;
    }, new Map<number, Balance>());
    return curr.filter((a) => !areBalancesEqual(a.balance, m.get(a.id)));
  }
}
