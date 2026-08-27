import { PolkadotClient } from 'polkadot-api';

import { log } from '@galacticcouncil/common';

import { Subject, Subscription, takeUntil } from 'rxjs';

import { BlockAt, Papi } from '../api';
import { EvmClient } from '../evm';
import { PoolNotFound } from '../errors';

import { AavePoolClient } from './amm/aave';
import { HsmPoolClient } from './amm/hsm';
import { LbpPoolClient } from './amm/lbp';
import { OmniPoolClient } from './amm/omni';
import { XykPoolClient } from './amm/xyk';
import { StableSwapClient } from './amm/stable';
import { UniswapV3PoolClient } from './amm/uniswapv3';
import {
  IPoolCtxProvider,
  Pool,
  PoolBase,
  PoolFees,
  PoolPair,
  PoolTokenOverride,
  PoolType,
} from './types';

import { PoolClient } from './PoolClient';

const { logger } = log;

export class PoolContextProvider extends Papi implements IPoolCtxProvider {
  readonly evm: EvmClient;

  readonly aave: AavePoolClient;
  readonly omnipool: OmniPoolClient;
  readonly stableswap: StableSwapClient;
  readonly hsm: HsmPoolClient;
  readonly xyk: XykPoolClient;
  readonly lbp: LbpPoolClient;
  readonly uniswapv3: UniswapV3PoolClient;

  private readonly active: Set<PoolType> = new Set([]);
  private readonly pools: Map<string, PoolBase> = new Map([]);

  /**
   * Venues whose pool set the map already holds.
   *
   * - A venue joins once ONE load has established its set, empty included: a
   *   venue with no pools on this chain emits nothing, so subscription traffic
   *   alone cannot tell "none here" from "not read yet"
   * - A venue whose load fails never joins, so the next read tries again
   */
  private readonly loaded: Set<PoolType> = new Set([]);
  private readonly clients: (
    | AavePoolClient
    | OmniPoolClient
    | StableSwapClient
    | HsmPoolClient
    | XykPoolClient
    | LbpPoolClient
    | UniswapV3PoolClient
  )[] = [];

  private aaveSub: Subscription = Subscription.EMPTY;
  private omniSub: Subscription = Subscription.EMPTY;
  private stableSub: Subscription = Subscription.EMPTY;
  private hsmSub: Subscription = Subscription.EMPTY;
  private xykSub: Subscription = Subscription.EMPTY;
  private lbpSub: Subscription = Subscription.EMPTY;
  private v3Sub: Subscription = Subscription.EMPTY;

  private pending?: Promise<PoolBase[]>;
  private isDestroyed = new Subject<boolean>();

  constructor(client: PolkadotClient, evm: EvmClient, at?: BlockAt) {
    super(client, at);
    this.evm = evm;
    this.aave = new AavePoolClient(client, evm, at);
    this.omnipool = new OmniPoolClient(client, evm, at);
    this.stableswap = new StableSwapClient(client, evm, at);
    this.hsm = new HsmPoolClient(client, evm, this.stableswap, at);
    this.xyk = new XykPoolClient(client, evm, at);
    this.lbp = new LbpPoolClient(client, evm, at);
    this.uniswapv3 = new UniswapV3PoolClient(client, evm, at);
    this.clients = [
      this.aave,
      this.omnipool,
      this.stableswap,
      this.hsm,
      this.xyk,
      this.lbp,
      this.uniswapv3,
    ];
  }

  private get isSnapshot(): boolean {
    return this.at !== 'best';
  }

  private subscribe<T extends PoolBase>(client: PoolClient<T>) {
    if (this.isSnapshot) {
      return Subscription.EMPTY;
    }

    return client
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pools: T[]) => {
        this.absorb(client.getPoolType(), pools);
      });
  }

  /** Fold a venue's pools into the map and record that it has been read */
  private absorb(type: PoolType, pools: readonly PoolBase[]): void {
    for (const pool of pools) {
      this.pools.set(pool.address, pool);
    }
    this.loaded.add(type);
  }

  /**
   * Whether the map holds every active venue.
   *
   * - Serving a partial set as if it were complete routes around a venue that
   *   is merely slow, and the quote looks perfectly healthy
   * - A fixed block has no subscription keeping the map fresh, so it is never
   *   ready and every read loads again
   */
  private get isReady(): boolean {
    if (this.isSnapshot) return false;
    for (const type of this.active) {
      if (!this.loaded.has(type)) return false;
    }
    return true;
  }

  public withAave(): this {
    this.aaveSub.unsubscribe();
    this.aaveSub = this.subscribe(this.aave);
    this.active.add(PoolType.Aave);
    return this;
  }

  public withOmnipool(): this {
    this.omniSub.unsubscribe();
    this.omniSub = this.subscribe(this.omnipool);
    this.active.add(PoolType.Omni);
    return this;
  }

  public withStableswap(): this {
    this.stableSub.unsubscribe();
    this.stableSub = this.subscribe(this.stableswap);
    this.active.add(PoolType.Stable);
    return this;
  }

  public withHsm(): this {
    if (!this.active.has(PoolType.Stable)) {
      logger.info('[PoolContextProvider] auto-activating stableswap');
      this.withStableswap();
    }

    this.hsmSub.unsubscribe();
    this.hsmSub = this.subscribe(this.hsm);
    this.active.add(PoolType.HSM);
    return this;
  }

  public withXyk(override?: PoolTokenOverride[]): this {
    this.xyk.withOverride(override);
    this.xykSub.unsubscribe();
    this.xykSub = this.subscribe(this.xyk);
    this.active.add(PoolType.XYK);
    return this;
  }

  public withLbp(): this {
    this.lbpSub.unsubscribe();
    this.lbpSub = this.subscribe(this.lbp);
    this.active.add(PoolType.LBP);
    return this;
  }

  public withV3(): this {
    this.v3Sub.unsubscribe();
    this.v3Sub = this.subscribe(this.uniswapv3);
    this.active.add(PoolType.V3);
    return this;
  }

  public destroy(): void {
    this.isDestroyed.next(true);
    this.isDestroyed.complete();
    this.active.clear();
    this.pools.clear();
    this.loaded.clear();
    this.pending = undefined;
  }

  public async getPools(at: BlockAt = this.at): Promise<PoolBase[]> {
    if (this.isReady) {
      const pools = this.pools.values();
      return Array.from(pools);
    }
    return this.loadAll(at);
  }

  /**
   * Read every active venue at one block.
   *
   * - Concurrent callers share one pass; a venue that is slow to seed would
   *   otherwise be re-read once per quote
   * - Folds the result in directly rather than waiting for it to arrive back
   *   through the venue's subscription
   *
   * @param at - block to read at
   */
  private loadAll(at: BlockAt): Promise<PoolBase[]> {
    if (this.pending) return this.pending;

    const clients = this.clients.filter((client) =>
      this.active.has(client.getPoolType())
    );

    this.pending = Promise.all(clients.map((client) => client.getPools(at)))
      .then((sets) => {
        if (!this.isSnapshot) {
          clients.forEach((client, i) =>
            this.absorb(client.getPoolType(), sets[i])
          );
        }
        return sets.flat();
      })
      .finally(() => {
        this.pending = undefined;
      });

    return this.pending;
  }

  public async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    const client = this.clients.find((c) => c.getPoolType() === pool.type);
    if (client) {
      return client.getPoolFees(poolPair, pool.address);
    }
    throw new PoolNotFound(pool.type);
  }
}
