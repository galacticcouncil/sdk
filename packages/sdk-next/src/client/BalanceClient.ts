import { PolkadotClient } from 'polkadot-api';

import { h160, log } from '@galacticcouncil/common';
import { HydrationQueries } from '@galacticcouncil/descriptors';

import {
  type Observable,
  EMPTY,
  combineLatest,
  concat,
  defer,
  from,
  merge,
} from 'rxjs';

import {
  bufferCount,
  distinctUntilChanged,
  debounceTime,
  filter,
  map,
  mergeMap,
  retry,
  startWith,
  switchMap,
  tap,
  take,
  skip,
  connect,
} from 'rxjs/operators';

import { BlockAt, Papi } from '../api';
import { SYSTEM_ASSET_ID } from '../consts';
import { AssetBalance, Balance } from '../types';

import { decodeErc20Transfer } from './Erc20Log';

const { H160 } = h160;

/**
 * Full ERC20 re-read cadence (in best blocks) as a safety net: a missed or
 * unmapped Transfer log can't permanently stale a balance. ~6s/block on
 * Hydration => a full reconcile roughly every ~2 minutes.
 */
const ERC20_SAFETY_REREAD_BLOCKS = 20;

type TSystemAccount = HydrationQueries['System']['Account']['Value'];
type TTokenAccount = HydrationQueries['Tokens']['Accounts']['Value'];
type TAccount = TSystemAccount['data'] | TTokenAccount;

const { logger } = log;

export class BalanceClient extends Papi {
  private erc20Ids: number[] | null = null;

  constructor(client: PolkadotClient, at?: BlockAt) {
    super(client, at);
  }

  async getBalance(account: string, assetId: number): Promise<Balance> {
    return assetId === SYSTEM_ASSET_ID
      ? this.getSystemBalance(account)
      : this.getBalanceData(account, assetId);
  }

  async getSystemBalance(account: string): Promise<Balance> {
    const query = this.api.query.System.Account;
    const { data } = await query.getValue(account, { at: this.at });
    return this.getBreakdown(data);
  }

  async getTokenBalance(account: string, assetId: number): Promise<Balance> {
    const query = this.api.query.Tokens.Accounts;
    const data = await query.getValue(account, assetId, { at: this.at });
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

    return defer(() => query.watchValue(address, { at: 'best' })).pipe(
      map(
        ({ value }) =>
          ({
            id: SYSTEM_ASSET_ID,
            balance: this.getBreakdown(value.data),
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

    return defer(() => query.watchValue(address, assetId, { at: 'best' })).pipe(
      map(
        ({ value }) =>
          ({
            id: assetId,
            balance: this.getBreakdown(value),
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
      if (this.erc20Ids) {
        return this.erc20Ids;
      }

      const assets = await this.api.query.AssetRegistry.Assets.getEntries({
        at: 'best',
      });
      this.erc20Ids = assets
        .filter(({ value }) => value.asset_type.type === 'Erc20')
        .map(({ keyArgs }) => {
          const [id] = keyArgs;
          return id as number;
        });
      return this.erc20Ids;
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
        switchMap((ids) => {
          if (ids.length === 0) {
            return from(Promise.resolve([] as AssetBalance[]));
          }

          const watched = new Set(ids);
          // best-effort H160 of the watched account; ERC20 Transfer topics carry
          // H160 from/to, so we compare against this.
          let owner: string | null = null;
          try {
            owner = H160.fromAny(address).toLowerCase();
          } catch {
            owner = null;
          }

          /**
           * Event gate: emit the set of ids to re-read whenever an ERC20
           * Transfer log names the watched account as from/to. null = full read.
           */
          const eventIds$ = owner
            ? this.api.event.EVM.Log.watch().pipe(
                mergeMap(({ events }) => events),
                map(({ payload }) => decodeErc20Transfer(payload)),
                filter(
                  (t): t is NonNullable<typeof t> =>
                    t !== undefined &&
                    t.assetId !== null &&
                    watched.has(t.assetId) &&
                    (t.from === owner || t.to === owner)
                ),
                map((t) => [t.assetId as number] as number[] | null)
              )
            : EMPTY;

          /**
           * Safety net: a full re-read every N blocks so a missed/unmapped log
           * (e.g. a non-EVM mutation of an ERC20-typed asset) can't permanently
           * stale a balance. Skips block 0 (the seed already covers it).
           */
          const safetyIds$ = this.watcher.bestBlock$.pipe(
            skip(1),
            bufferCount(ERC20_SAFETY_REREAD_BLOCKS),
            map(() => null as number[] | null)
          );

          // Seed: full read (null), then targeted/full re-reads on triggers.
          // a running snapshot map merges each (partial) read so every emission
          // is the COMPLETE ERC20 balance set, preserving the previous
          // switchMap-per-block output shape (full array, downstream-diffed).
          return concat(
            from(Promise.resolve(null as number[] | null)),
            merge(eventIds$, safetyIds$)
          ).pipe(
            // serialise reads to keep snapshot updates consistent
            mergeMap(
              (toRead) =>
                from(fetchBalance(toRead ?? ids)).pipe(
                  map((part) => part as AssetBalance[])
                ),
              1
            ),
            // accumulate into a full id->balance snapshot, emit the full array
            (source$) => {
              const snapshot = new Map<number, Balance>();
              return source$.pipe(
                map((part) => {
                  for (const { id, balance } of part) {
                    snapshot.set(id, balance);
                  }
                  return Array.from(snapshot.entries()).map(
                    ([id, balance]) => ({ id, balance }) as AssetBalance
                  );
                })
              );
            }
          );
        }),
        startWith([] as AssetBalance[]),
        bufferCount(2, 1),
        map(([prev, curr], i) => {
          if (i === 0) return curr.filter((a) => a.balance.total > 0n);
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
      at: this.at,
    });
    return this.getBreakdown(data);
  }

  private getBreakdown(data: TAccount): Balance {
    const freezeExcess = data.frozen - data.reserved;
    const netFreezeConstraint = freezeExcess > 0n ? freezeExcess : 0n;

    const transferable =
      data.free >= netFreezeConstraint ? data.free - netFreezeConstraint : 0n;
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
