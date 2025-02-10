import { PolkadotClient } from 'polkadot-api';

import { memoize1 } from '@thi.ng/memoize';

import { LbpPoolClient } from './lbp';
import { OmniPoolClient } from './omni';
import { XykPoolClient } from './xyk';
import { StableSwapClient } from './stable';

import { AssetClient } from '../client';
import { PoolNotFound } from '../errors';
import { Papi } from '../provider';
import { Hop, IPoolService, PoolBase, PoolFees, PoolType, Pool } from '../pool';

import { Asset, ExternalAsset, Transaction } from '../types';

import { PoolClient } from './PoolClient';

export class PoolService extends Papi implements IPoolService {
  protected readonly assetClient: AssetClient;

  protected readonly xykClient: XykPoolClient;
  protected readonly omniClient: OmniPoolClient;
  protected readonly lbpClient: LbpPoolClient;
  protected readonly stableClient: StableSwapClient;

  protected readonly clients: PoolClient[] = [];

  protected onChainAssets: Asset[] = [];

  private memRegistry = memoize1((x: number) => {
    console.log('Registry mem sync', x, '✅');
    return this.syncRegistry();
  });

  constructor(client: PolkadotClient) {
    super(client);
    this.assetClient = new AssetClient(client);
    this.xykClient = new XykPoolClient(client);
    this.omniClient = new OmniPoolClient(client);
    this.lbpClient = new LbpPoolClient(client);
    this.stableClient = new StableSwapClient(client);
    this.clients = [
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
    this.xykClient.unsubscribe();
    this.omniClient.unsubscribe();
    this.lbpClient.unsubscribe();
    this.stableClient.unsubscribe();
  }

  async getPoolFees(pool: Pool, feeAsset: number): Promise<PoolFees> {
    switch (pool.type) {
      case PoolType.XYK:
        return this.xykClient.getPoolFees(pool.address);
      case PoolType.Omni:
        return this.omniClient.getPoolFees(pool.address, feeAsset);
      case PoolType.LBP:
        return this.lbpClient.getPoolFees(pool.address, feeAsset);
      case PoolType.Stable:
        return this.stableClient.getPoolFees(pool.address, feeAsset);
      default:
        throw new PoolNotFound(pool.type);
    }
  }

  private isDirectOmnipoolTrade(route: Hop[]) {
    return route.length == 1 && route[0].pool == PoolType.Omni;
  }

  buildBuyTx(
    assetIn: number,
    assetOut: number,
    amountOut: bigint,
    maxAmountIn: bigint,
    route: Hop[]
  ): Transaction {
    throw new Error('Not supported yet');
  }

  buildSellTx(
    assetIn: number,
    assetOut: number,
    amountIn: bigint,
    minAmountOut: bigint,
    route: Hop[]
  ): Transaction {
    throw new Error('Noit supported yet');
  }
}
