import { PoolNotFound } from '../../errors';

import { IOfflinePoolServiceDataSource, PersistentAsset } from './types';
import { OmniPoolOfflineClient } from './offlineClients/OmniPoolOfflineClient';
import { AavePoolOfflineClient } from './offlineClients/AavePoolOfflineClient';
import { LbpPoolOfflineClient } from './offlineClients/LbpPoolOfflineClient';
import { XykPoolOfflineClient } from './offlineClients/XykPoolOfflineClient';
import { StableSwapOfflineClient } from './offlineClients/StableSwapOfflineClient';
import { OfflinePoolClient } from './offlineClients/OfflinePoolClient';
import { AssetOfflineClient } from './offlineClients/AssetOfflineClient';
import {
  IPoolCtxProvider,
  Pool,
  PoolBase,
  PoolFees,
  PoolPair,
  PoolType,
} from '../types';

export class OfflinePoolService implements IPoolCtxProvider {
  protected block: number = 0;
  protected readonly assetOfflineClient: AssetOfflineClient;

  protected readonly aaveOfflineClient: AavePoolOfflineClient;
  protected readonly xykOfflineClient: XykPoolOfflineClient;
  protected readonly omniOfflineClient: OmniPoolOfflineClient;
  protected readonly lbpOfflineClient: LbpPoolOfflineClient;
  protected readonly stableOfflineClient: StableSwapOfflineClient;

  protected readonly offlineClients: OfflinePoolClient[] = [];

  protected onChainAssets: PersistentAsset[] = [];

  private readonly active: Set<PoolType> = new Set([]);

  constructor(dataSource: IOfflinePoolServiceDataSource) {
    this.assetOfflineClient = new AssetOfflineClient(dataSource);
    this.aaveOfflineClient = new AavePoolOfflineClient(dataSource);
    this.xykOfflineClient = new XykPoolOfflineClient(dataSource);
    this.lbpOfflineClient = new LbpPoolOfflineClient(dataSource);
    this.stableOfflineClient = new StableSwapOfflineClient(dataSource);
    this.omniOfflineClient = new OmniPoolOfflineClient(dataSource);

    this.offlineClients = [
      this.aaveOfflineClient,
      this.xykOfflineClient,
      this.lbpOfflineClient,
      this.stableOfflineClient,
      this.omniOfflineClient,
    ];

    this.block = dataSource.meta.paraBlockNumber;

    this.syncRegistry();
  }

  get assets(): PersistentAsset[] {
    return this.onChainAssets;
  }

  get isRegistrySynced(): boolean {
    return this.onChainAssets.length > 0;
  }

  syncRegistry() {
    const assets = this.assetOfflineClient.getOnChainAssets(false);
    this.offlineClients.forEach((c) => c.withAssets(assets));
    this.onChainAssets = assets;
  }

  public withAave(): this {
    this.active.add(PoolType.Aave);
    return this;
  }

  public withOmnipool(): this {
    this.active.add(PoolType.Omni);
    return this;
  }

  public withStableswap(): this {
    this.active.add(PoolType.Stable);
    return this;
  }

  public withXyk(): this {
    this.active.add(PoolType.XYK);
    return this;
  }

  public withLbp(): this {
    this.active.add(PoolType.LBP);
    return this;
  }

  async getPools(): Promise<PoolBase[]> {
    if (!this.isRegistrySynced) {
      this.syncRegistry();
    }

    const pools = this.offlineClients
      .filter(
        (client) =>
          this.active.has(client.getPoolType()) && client.isSupported()
      )
      .map((client) => client.getPools());
    return pools.flat();
  }

  async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    switch (pool.type) {
      case PoolType.Aave:
        return this.aaveOfflineClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      case PoolType.XYK:
        return this.xykOfflineClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      case PoolType.Omni:
        return this.omniOfflineClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      case PoolType.LBP:
        return this.lbpOfflineClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      case PoolType.Stable:
        return this.stableOfflineClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      default:
        throw new PoolNotFound(pool.type);
    }
  }
}
