import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  Subscription,
  bufferCount,
  combineLatest,
  debounceTime,
  defer,
  filter,
  finalize,
  firstValueFrom,
  from,
  map,
  skip,
  share,
  startWith,
  switchMap,
  take,
} from 'rxjs';

import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { MmOracleClient } from '../oracle';
import { AssetBalance } from '../types';
import { json } from '../utils';

import { PoolBase, PoolFees, PoolTokenOverride, PoolType } from './types';

const { jsonFormatter } = json;

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected evm: EvmClient;
  protected mmOracle: MmOracleClient;

  protected store$ = new BehaviorSubject<T[]>([]);

  private shared$?: Observable<T[]>;
  private override: PoolTokenOverride[] = [];
  private mem: number = 0;

  private memPools = memoize1((mem: number) => {
    this.log(this.getPoolType(), 'mem pools', mem, '✅');
    return this.loadPools();
  });

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
    this.mmOracle = new MmOracleClient(evm);
  }

  abstract isSupported(): Promise<boolean>;
  abstract getPoolFees(pool: T, feeAsset: number): Promise<PoolFees>;
  abstract getPoolType(): PoolType;
  protected abstract loadPools(): Promise<T[]>;
  protected abstract subscribeUpdates(pools: T[]): Observable<T[]>;

  private async getMemPools(): Promise<T[]> {
    return this.memPools(this.mem);
  }

  async withOverride(override?: PoolTokenOverride[]) {
    this.override = override || [];
  }

  async getPools(): Promise<T[]> {
    const sub = this.getSubscriber();
    return firstValueFrom(sub);
  }

  getSubscriber(): Observable<T[]> {
    return from(this.getMemPools()).pipe(
      switchMap((initial) => this.subscribe(initial))
    );
  }

  private subscribe(initial: T[]): Observable<T[]> {
    if (!this.shared$) {
      this.shared$ = this.subscribeStore(initial);
    }

    const filterDeltas = (prev: T[], curr: T[]): T[] => {
      const prevBy = new Map(prev.map((p) => [p.address, p]));
      const changed: T[] = [];
      for (const p of curr) {
        const old = prevBy.get(p.address);

        if (
          JSON.stringify(old, jsonFormatter) !==
          JSON.stringify(p, jsonFormatter)
        ) {
          changed.push(p);
        }
      }
      return changed;
    };

    return this.shared$.pipe(
      startWith([] as T[]),
      bufferCount(2, 1),
      map(([prev, curr]) => {
        if (prev.length === 0) return curr;
        return filterDeltas(prev, curr);
      }),
      filter((arr) => arr.length > 0)
    );
  }

  private subscribeStore(initial: T[]): Observable<T[]> {
    const valid = initial.filter((pool) => this.hasValidAssets(pool));
    return defer(() => {
      const updates$ = this.subscribeUpdates(valid);
      const balances$ = this.subscribeBalances(valid);

      const sub = new Subscription();

      // 1) Seed once per re-wire with fresh values
      sub.add(
        combineLatest([
          updates$.pipe(take(1)),
          balances$.pipe(take(1)),
        ]).subscribe(([poolsNow, balancesNow]) => {
          const seeded = this.updateSnapshot(poolsNow, balancesNow);
          this.store$.next(seeded);
        })
      );

      // 2) Structural changes (skip the seed emission)
      sub.add(
        updates$.pipe(skip(1)).subscribe((next) => {
          const curr = this.store$.value;
          // this.store$.next([...next]);
        })
      );

      // 3) Balance changes (skip the seed emission)
      sub.add(
        balances$.pipe(skip(1)).subscribe((latest) => {
          const curr = this.store$.value;
          const next = this.updateSnapshot(curr, latest);
          this.store$.next(next);
        })
      );

      return this.store$.asObservable().pipe(
        skip(1), // No stale first emission on re-wire, wait for seeded
        finalize(() => {
          /**
           * Kill internal wiring if no subscription active
           */
          sub.unsubscribe();
        })
      );
    }).pipe(
      share({
        /**
         * Late subscribers get the latest snapshot immediately
         * from the connector’s buffer, even if upstream hasn’t
         * emitted again yet in this ref-count cycle.
         *
         * Ensures single wiring for all subscribers.
         */
        connector: () => new ReplaySubject<T[]>(1),
        resetOnRefCountZero: true,
      })
    );
  }

  protected subscribeBalances(
    pools: T[]
  ): Observable<Map<string, AssetBalance[]>> {
    const pool$ = pools.map((pool) => {
      const { address } = pool;

      const subs: Observable<AssetBalance | AssetBalance[]>[] = [
        this.subscribeTokensBalance(address),
      ];

      if (this.hasSystemAsset(pool)) {
        const sysSub = this.subscribeSystemBalance(address);
        subs.push(sysSub);
      }

      if (this.hasErc20Asset(pool)) {
        const ids = pool.tokens
          .filter((t) => t.type === 'Erc20')
          .map((t) => t.id);
        const erc20Sub = this.subscribeErc20Balance(address, ids);
        subs.push(erc20Sub);
      }

      return combineLatest(subs).pipe(
        map((balance) => balance.flat()),
        map((balances) => [address, balances] as const)
      );
    });

    return combineLatest(pool$).pipe(
      debounceTime(250),
      map((entries) => new Map(entries))
    );
  }

  private hasSystemAsset(pool: T): boolean {
    return pool.tokens.some((t) => t.id === SYSTEM_ASSET_ID);
  }

  private hasErc20Asset(pool: PoolBase) {
    return pool.tokens.some((t) => t.type === 'Erc20');
  }

  private hasValidAssets(pool: T): boolean {
    return pool.tokens.every(({ id, decimals, balance }) => {
      const override = this.override.find((o) => o.id === id);
      const hasDecimals = !!decimals || !!override?.decimals;
      return balance > 0n && hasDecimals;
    });
  }

  private updateSnapshot = (
    pools: T[],
    balances: Map<string, AssetBalance[]>
  ): T[] => {
    return pools.map((pool) => {
      const { address, tokens } = pool;
      const uBalances = balances.get(address) || [];
      const uTokens = tokens.map((token) => {
        const aBalance = uBalances.find((balance) => balance.id === token.id);
        const aOverride = this.override.find((o) => o.id === token.id);
        if (aBalance && token.id !== pool.id) {
          return {
            ...token,
            balance: aBalance.balance.transferable,
            decimals: token.decimals || aOverride?.decimals,
          };
        }
        return {
          ...token,
          decimals: token.decimals || aOverride?.decimals,
        };
      });
      return {
        ...pool,
        tokens: uTokens,
      } as T;
    });
  };
}
