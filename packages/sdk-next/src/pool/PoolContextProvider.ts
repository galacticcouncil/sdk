import { PolkadotClient } from 'polkadot-api';

import { Subject, Subscription, takeUntil } from 'rxjs';

import { Papi } from '../api';
import { EvmClient } from '../evm';
import { PoolNotFound } from '../errors';

import { AavePoolClient } from './aave';
import { HsmPoolClient } from './hsm';
import { LbpPoolClient } from './lbp';
import { OmniPoolClient } from './omni';
import { XykPoolClient } from './xyk';
import { StableSwapClient } from './stable';
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

export class PoolContextProvider extends Papi implements IPoolCtxProvider {
  readonly evm: EvmClient;

  readonly aave: AavePoolClient;
  readonly omnipool: OmniPoolClient;
  readonly stableswap: StableSwapClient;
  readonly hsm: HsmPoolClient;
  readonly xyk: XykPoolClient;
  readonly lbp: LbpPoolClient;

  private readonly active: Set<PoolType> = new Set([]);
  private readonly pools: Map<string, PoolBase> = new Map([]);
  private readonly clients: (
    | AavePoolClient
    | OmniPoolClient
    | StableSwapClient
    | HsmPoolClient
    | XykPoolClient
    | LbpPoolClient
  )[] = [];

  private aaveSub: Subscription = Subscription.EMPTY;
  private omniSub: Subscription = Subscription.EMPTY;
  private stableSub: Subscription = Subscription.EMPTY;
  private hsmSub: Subscription = Subscription.EMPTY;
  private xykSub: Subscription = Subscription.EMPTY;
  private lbpSub: Subscription = Subscription.EMPTY;

  private isReady: boolean = false;
  private isDestroyed = new Subject<boolean>();

  constructor(client: PolkadotClient, evm: EvmClient) {
    super(client);
    this.evm = evm;
    this.aave = new AavePoolClient(client, evm);
    this.omnipool = new OmniPoolClient(client, evm);
    this.stableswap = new StableSwapClient(client, evm);
    this.hsm = new HsmPoolClient(client, evm, this.stableswap);
    this.xyk = new XykPoolClient(client, evm);
    this.lbp = new LbpPoolClient(client, evm);
    this.clients = [
      this.aave,
      this.omnipool,
      this.stableswap,
      this.hsm,
      this.xyk,
      this.lbp,
    ];
  }

  private subscribe<T extends PoolBase>(client: PoolClient<T>) {
    return client
      .getSubscriber()
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((pools: T[]) => {
        pools.forEach((p) => {
          this.pools.set(p.address, p);
        });
      });
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

  public destroy(): void {
    this.isDestroyed.next(true);
    this.isDestroyed.complete();
    this.active.clear();
    this.pools.clear();
    this.isReady = false;
  }

  public async getPools(): Promise<PoolBase[]> {
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

  public async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    const client = this.clients.find((c) => c.getPoolType() === pool.type);
    if (client) {
      return client.getPoolFees(poolPair, pool.address);
    }
    throw new PoolNotFound(pool.type);
  }
}
