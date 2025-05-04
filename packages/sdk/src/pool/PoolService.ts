import { ApiPromise } from '@polkadot/api';

import { memoize1 } from '@thi.ng/memoize';

import { PolkadotApiClient } from '../api';
import { AssetClient } from '../client';
import { PoolNotFound } from '../errors';
import { Asset, ExternalAsset } from '../types';

import { AavePoolClient } from './aave';
import { LbpPoolClient } from './lbp';
import { OmniPoolClient } from './omni';
import { XykPoolClient } from './xyk';
import { StableSwapClient } from './stable';

import {
  IPoolService,
  Pool,
  PoolBase,
  PoolFees,
  PoolPair,
  PoolType,
} from './types';

import { PoolClient } from './PoolClient';

export class PoolService extends PolkadotApiClient implements IPoolService {
  protected readonly api: ApiPromise;

  protected readonly assetClient: AssetClient;

  protected readonly aaveClient: AavePoolClient;
  protected readonly xykClient: XykPoolClient;
  protected readonly omniClient: OmniPoolClient;
  protected readonly lbpClient: LbpPoolClient;
  protected readonly stableClient: StableSwapClient;

  protected readonly clients: PoolClient[] = [];

  protected onChainAssets: Asset[] = [];

  private memRegistry = memoize1((mem: number) => {
    this.log(`Registry mem ${mem} sync`);
    return this.syncRegistry();
  });

  constructor(api: ApiPromise) {
    super(api);
    this.api = api;
    this.assetClient = new AssetClient(this.api);
    this.aaveClient = new AavePoolClient(this.api);
    this.xykClient = new XykPoolClient(this.api);
    this.omniClient = new OmniPoolClient(this.api);
    this.lbpClient = new LbpPoolClient(this.api);
    this.stableClient = new StableSwapClient(this.api);
    this.clients = [
      this.aaveClient,
      this.xykClient,
      this.omniClient,
      this.lbpClient,
      this.stableClient,
    ];
  }

  get assets(): Asset[] {
    return this.onChainAssets;
  }

  get isRegistrySynced(): boolean {
    return this.onChainAssets.length > 0;
  }

  async syncRegistry(external?: ExternalAsset[]) {
    const assets = await this.assetClient.getOnChainAssets(false, external);
    this.clients.forEach((c) => c.withAssets(assets));
    this.onChainAssets = assets;
  }

  async getPools(includeOnly: PoolType[]): Promise<PoolBase[]> {
    if (!this.isRegistrySynced) {
      await this.memRegistry(1);
    }

    if (includeOnly.length == 0) {
      const pools = await Promise.all(
        this.clients
          .filter((client) => client.isSupported())
          .map((client) => client.getPoolsMem())
      );
      return pools.flat();
    }

    const pools = await Promise.all(
      this.clients
        .filter((client) => includeOnly.some((t) => t === client.getPoolType()))
        .map((client) => client.getPoolsMem())
    );
    return pools.flat();
  }

  unsubscribe() {
    this.aaveClient.unsubscribe();
    this.xykClient.unsubscribe();
    this.omniClient.unsubscribe();
    this.lbpClient.unsubscribe();
    this.stableClient.unsubscribe();
  }

  async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    switch (pool.type) {
      case PoolType.Aave:
        return this.aaveClient.getPoolFees(poolPair, pool.address);
      case PoolType.XYK:
        return this.xykClient.getPoolFees(poolPair, pool.address);
      case PoolType.Omni:
        return this.omniClient.getPoolFees(poolPair, pool.address);
      case PoolType.LBP:
        return this.lbpClient.getPoolFees(poolPair, pool.address);
      case PoolType.Stable:
        return this.stableClient.getPoolFees(poolPair, pool.address);
      default:
        throw new PoolNotFound(pool.type);
    }
  }
}
