import { PolkadotClient } from 'polkadot-api';

import { Subject, Subscription, takeUntil } from 'rxjs';

import { Papi } from '../api';
import { EvmClient } from '../evm';
import { PoolNotFound } from '../errors';

import { AavePoolClient } from './aave';
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
  readonly evm: EvmClient;

  private readonly lbpClient: LbpPoolClient;
  private readonly omniClient: OmniPoolClient;
  private readonly stableClient: StableSwapClient;
  private readonly xykClient: XykPoolClient;
  private readonly aaveClient: AavePoolClient;

  private readonly active: Set<PoolType> = new Set([]);
  private readonly clients: PoolClient<PoolBase>[] = [];
  private readonly pools: Map<string, PoolBase> = new Map([]);

  private lbpSub: Subscription = Subscription.EMPTY;
  private omniSub: Subscription = Subscription.EMPTY;
  private stableSub: Subscription = Subscription.EMPTY;
  private xykSub: Subscription = Subscription.EMPTY;
  private aaveSub: Subscription = Subscription.EMPTY;

  private isReady: boolean = false;
  private isDestroyed = new Subject<boolean>();

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
    this.lbpClient = new LbpPoolClient(client, evm);
    this.omniClient = new OmniPoolClient(client, evm);
    this.stableClient = new StableSwapClient(client, evm);
    this.xykClient = new XykPoolClient(client, evm);
    this.aaveClient = new AavePoolClient(client, evm);
    this.clients = [
      this.lbpClient,
      this.omniClient,
      this.stableClient,
      this.xykClient,
      this.aaveClient,
    ];
  }

  private subscribe(client: PoolClient<PoolBase>) {
    return client
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pool) => {
        this.pools.set(pool.address, pool);
      });
  }

  public withOmnipool(): this {
    this.omniSub.unsubscribe();
    this.omniSub = this.subscribe(this.omniClient);
    this.active.add(PoolType.Omni);
    return this;
  }

  public withStableswap(): this {
    this.stableSub.unsubscribe();
    this.stableSub = this.subscribe(this.stableClient);
    this.active.add(PoolType.Stable);
    return this;
  }

  public withLbp(): this {
    this.lbpSub.unsubscribe();
    this.lbpSub = this.subscribe(this.lbpClient);
    this.active.add(PoolType.LBP);
    return this;
  }

  public withAave(): this {
    this.aaveSub.unsubscribe();
    this.aaveSub = this.subscribe(this.aaveClient);
    this.active.add(PoolType.Aave);
    return this;
  }

  public withXyk(override?: PoolTokenOverride[]): this {
    this.xykClient.withOverride(override);
    this.xykSub.unsubscribe();
    this.xykSub = this.subscribe(this.xykClient);
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

  /**
   * Lazy load & cache pools. By default following amm types are
   * subscribed:
   *
   * 1) aave
   * 2) omnipool
   * 3) stableswap
   * 4) xyk
   *
   * @returns active pool context
   */
  public async getPools(): Promise<PoolBase[]> {
    if (this.active.size === 0) {
      this.withAave().withOmnipool().withStableswap().withXyk();
    }

    if (this.isReady) {
      const pools = this.pools.values();
      return Array.from(pools);
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
