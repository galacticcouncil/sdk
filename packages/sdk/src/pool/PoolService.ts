import { ApiPromise } from '@polkadot/api';

import { memoize1 } from '@thi.ng/memoize';

import { PolkadotApiClient } from '../api';
import { AssetClient } from '../client';
import { PoolNotFound } from '../errors';
import { EvmClient } from '../evm';
import { Asset, ExternalAsset } from '../types';

import { AavePoolClient } from './aave';
import { LbpPoolClient } from './lbp';
import { OmniPoolClient } from './omni';
import { XykPoolClient } from './xyk';
import { StableSwapClient } from './stable';
import { HsmClient } from './hsm';

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
  protected readonly evm: EvmClient;

  protected readonly assetClient: AssetClient;

  protected readonly aaveClient: AavePoolClient;
  protected readonly xykClient: XykPoolClient;
  protected readonly omniClient: OmniPoolClient;
  protected readonly lbpClient: LbpPoolClient;
  protected readonly stableClient: StableSwapClient;
  protected readonly hsmClient: HsmClient;

  protected readonly clients: PoolClient[] = [];

  protected onChainAssets: Asset[] = [];
  protected block: number = 0;

  private disconnectSubscribeNewHeads: (() => void) | null = null;

  private memRegistry = memoize1((mem: number) => {
    this.log(`Registry mem ${mem} sync`);
    return this.syncRegistry();
  });

  constructor(api: ApiPromise, evm: EvmClient) {
    super(api);
    this.api = api;
    this.evm = evm;

    this.assetClient = new AssetClient(this.api);
    this.aaveClient = new AavePoolClient(this.api, evm);
    this.xykClient = new XykPoolClient(this.api, evm);
    this.omniClient = new OmniPoolClient(this.api, evm);
    this.lbpClient = new LbpPoolClient(this.api, evm);
    this.stableClient = new StableSwapClient(this.api, evm);
    this.hsmClient = new HsmClient(this.api, evm, this.stableClient);
    this.clients = [
      this.aaveClient,
      this.xykClient,
      this.omniClient,
      this.lbpClient,
      this.stableClient,
      this.hsmClient,
    ];

    this.api.rpc.chain
      .subscribeNewHeads(async (lastHeader) => {
        const block = lastHeader.number.toNumber();
        this.onNewBlock(block);
      })
      .then((subsFn) => {
        this.disconnectSubscribeNewHeads = subsFn;
      });
  }

  protected onNewBlock(block: number): void {
    this.block = block;
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

  destroy() {
    this.aaveClient.unsubscribe();
    this.xykClient.unsubscribe();
    this.omniClient.unsubscribe();
    this.lbpClient.unsubscribe();
    this.stableClient.unsubscribe();
    this.hsmClient.unsubscribe();
    this.disconnectSubscribeNewHeads?.();
  }

  async getPoolFees(poolPair: PoolPair, pool: Pool): Promise<PoolFees> {
    switch (pool.type) {
      case PoolType.Aave:
        return this.aaveClient.getPoolFees(this.block, poolPair, pool.address);
      case PoolType.XYK:
        return this.xykClient.getPoolFees(this.block, poolPair, pool.address);
      case PoolType.Omni:
        return this.omniClient.getPoolFees(this.block, poolPair, pool.address);
      case PoolType.LBP:
        return this.lbpClient.getPoolFees(this.block, poolPair, pool.address);
      case PoolType.Stable:
        return this.stableClient.getPoolFees(
          this.block,
          poolPair,
          pool.address
        );
      case PoolType.HSM:
        return this.hsmClient.getPoolFees(this.block, poolPair, pool.address);
      default:
        throw new PoolNotFound(pool.type);
    }
  }
}
