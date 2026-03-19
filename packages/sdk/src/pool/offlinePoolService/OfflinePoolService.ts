import { memoize1 } from '@thi.ng/memoize';
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
  Hop,
  IPoolService,
  Pool,
  PoolBase,
  PoolFees,
  PoolFilter,
  PoolPair,
  PoolType,
} from '../types';

export class OfflinePoolService implements IPoolService {
  protected block: number = 0;
  protected readonly assetOfflineClient: AssetOfflineClient;

  protected readonly aaveOfflineClient: AavePoolOfflineClient;
  protected readonly xykOfflineClient: XykPoolOfflineClient;
  protected readonly omniOfflineClient: OmniPoolOfflineClient;
  protected readonly lbpOfflineClient: LbpPoolOfflineClient;
  protected readonly stableOfflineClient: StableSwapOfflineClient;

  protected readonly offlineClients: OfflinePoolClient[] = [];

  protected onChainAssets: PersistentAsset[] = [];

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

  async getPools(filter: PoolFilter = {}): Promise<PoolBase[]> {
    if (!this.isRegistrySynced) {
      this.syncRegistry();
    }

    const { includeOnly = [], exclude = [] } = filter;

    if (includeOnly.length == 0) {
      const pools = this.offlineClients
        .filter((client) => client.isSupported())
        .map((client) => client.getPools());
      return Promise.resolve<PoolBase[]>(pools.flat());
    }

    const pools = this.offlineClients
      .filter((client) => includeOnly.some((t) => t === client.getPoolType()))
      .map((client) => client.getPools());

    return Promise.resolve<PoolBase[]>(pools.flat());
  }

  unsubscribe() {
    throw Error(
      'Method is not allowed for OfflinePool Service. Use PoolService instead.'
    );
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

  private isDirectOmnipoolTrade(route: Hop[]) {
    return route.length == 1 && route[0].pool == PoolType.Omni;
  }
}
