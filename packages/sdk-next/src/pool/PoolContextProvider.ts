import { PolkadotClient } from 'polkadot-api';

import { Subject, Subscription, takeUntil } from 'rxjs';

import { Papi } from '../api';
import { PoolNotFound } from '../errors';

import { LbpPoolClient } from './lbp';
import { OmniPoolClient } from './omni';
import { XykPoolClient } from './xyk';
import { StableSwapClient } from './stable';
import {
  IPoolCtxProvider,
  PoolBase,
  PoolFees,
  PoolTokenOverride,
  PoolType,
} from './types';

import { PoolClient } from './PoolClient';

export class PoolContextProvider extends Papi implements IPoolCtxProvider {
  private readonly lbpClient: LbpPoolClient;
  private readonly omniClient: OmniPoolClient;
  private readonly stableClient: StableSwapClient;
  private readonly xykClient: XykPoolClient;

  private readonly active: Set<PoolType> = new Set([]);
  private readonly clients: PoolClient<PoolBase>[] = [];
  private readonly pools: Map<string, PoolBase> = new Map([]);

  private lbpSub: Subscription = Subscription.EMPTY;
  private omniSub: Subscription = Subscription.EMPTY;
  private stableSub: Subscription = Subscription.EMPTY;
  private xykSub: Subscription = Subscription.EMPTY;

  private isReady: boolean = false;
  private isDestroyed = new Subject<boolean>();

  constructor(client: PolkadotClient) {
    super(client);
    this.lbpClient = new LbpPoolClient(client);
    this.omniClient = new OmniPoolClient(client);
    this.stableClient = new StableSwapClient(client);
    this.xykClient = new XykPoolClient(client);
    this.clients = [
      this.lbpClient,
      this.omniClient,
      this.stableClient,
      this.xykClient,
    ];
  }

  public withOmnipool(): this {
    this.omniSub.unsubscribe();
    this.omniSub = this.omniClient
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pool) => {
        this.pools.set(pool.address, pool);
      });
    this.active.add(PoolType.Omni);
    return this;
  }

  public withStableswap(): this {
    this.stableSub.unsubscribe();
    this.stableSub = this.stableClient
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pool) => {
        this.pools.set(pool.address, pool);
      });
    this.active.add(PoolType.Stable);
    return this;
  }

  public withLbp(): this {
    this.lbpSub.unsubscribe();
    this.lbpSub = this.lbpClient
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pool) => {
        this.pools.set(pool.address, pool);
      });
    this.active.add(PoolType.LBP);
    return this;
  }

  public withXyk(override?: PoolTokenOverride[]): this {
    this.xykClient.withOverride(override);
    this.xykSub.unsubscribe();
    this.xykSub = this.xykClient
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pool) => {
        this.pools.set(pool.address, pool);
      });
    this.active.add(PoolType.XYK);
    return this;
  }

  public destroy(): void {
    this.isDestroyed.next(true);
    this.isDestroyed.complete();
    this.active.clear();
    this.pools.clear();
    this.isReady = false;
  }

  public async getPools(): Promise<PoolBase[]> {
    if (this.active.size === 0) throw new Error('No pools selected');
    if (this.isReady) {
      return Array.from(this.pools.values());
    }

    const pools = await Promise.all(
      this.clients
        .filter((client) => this.active.has(client.getPoolType()))
        .map((client) => client.getPools())
    );
    this.isReady = true;
    return pools.flat();
  }

  public async getPoolFees(
    pool: PoolBase,
    feeAsset: number
  ): Promise<PoolFees> {
    const client = this.clients.find((c) => c.getPoolType() === pool.type);
    if (client) {
      return client.getPoolFees(pool, feeAsset);
    }
    throw new PoolNotFound(pool.type);
  }
}
