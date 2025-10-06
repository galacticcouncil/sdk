import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import {
  type Observable,
  bufferCount,
  bufferTime,
  concat,
  combineLatest,
  combineLatestAll,
  debounceTime,
  filter,
  firstValueFrom,
  forkJoin,
  from,
  map,
  merge,
  mergeAll,
  of,
  pairwise,
  scan,
  shareReplay,
  skip,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { BalanceClient } from '../client';
import { SYSTEM_ASSET_ID } from '../consts';
import { EvmClient } from '../evm';
import { MmOracleClient } from '../oracle';
import { AssetBalance } from '../types';

import { PoolBase, PoolFees, PoolTokenOverride, PoolType } from './types';

export abstract class PoolClient<T extends PoolBase> extends BalanceClient {
  protected evm: EvmClient;
  protected mmOracle: MmOracleClient;

  protected pools: T[] = [];

  private override: PoolTokenOverride[] = [];
  private mem: number = 0;

  private memPools = memoize1((mem: number) => {
    this.log(this.getPoolType(), 'mem pools', mem, '✅');
    return this.getValidPools();
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

  private async getValidPools(): Promise<T[]> {
    this.pools = await this.loadPools();
    return this.pools.filter((pool) => this.hasValidAssets(pool));
  }

  async getMemPools(): Promise<T[]> {
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
      switchMap((pools) => this.subscribe(pools)),
      tap({
        subscribe: () => console.log('subscribed'),
        unsubscribe: () => console.log('unsubscribed'),
      })
    );
  }

  private subscribe(pools: T[]): Observable<T[]> {
    return combineLatest([
      this.subscribeUpdates(pools),
      this.subscribeBalances(pools),
    ]).pipe(
      debounceTime(250),
      map(([pools, balances]) => {
        return this.updatePools(pools, balances);
      })
    );
  }

  subscribeBalances2(pools: T[]): Observable<Map<string, AssetBalance[]>> {
    const tokenQueries: [string, number][] = [];

    for (const pool of pools) {
      const { address, tokens } = pool;

      tokens
        .filter(
          (t) =>
            ['Token', 'StableSwap'].includes(t.type) &&
            t.id !== SYSTEM_ASSET_ID &&
            t.id !== pool.id
        )
        .forEach((t) => {
          tokenQueries.push([address, t.id]);
        });
    }

    return this.subscribeTokensBalanceByQuery(tokenQueries);
  }

  /**
   * Subscribe pools balances.
   *
   * Balances are emitted in 2 phases:
   *
   * 1) Initial: all pools with asset balances
   * 2) Updates: only deltas batched into a single emission
   *
   * @param pools - pools
   * @returns map of pool balances
   */
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
        //this.emitInitialAndDelta,
        map((balances) => [address, balances] as const)
        //shareReplay({ bufferSize: 1, refCount: true })
      );
    });

    return combineLatest(pool$).pipe(map((entries) => new Map(entries)));

    /*     const initial$ = combineLatest(pool$).pipe(
      take(1),
      map((entries) => new Map(entries))
    );

    const updates$ = from(pool$).pipe(
      map((s$) => s$.pipe(skip(1))),
      mergeAll(),
      bufferTime(250),
      filter((batch) => batch.length > 0),
      map((batch) => new Map(batch))
    );

    return merge(initial$, updates$); */
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

  private updatePools = (
    pools: PoolBase[],
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
