import { ApiPromise } from '@polkadot/api';
import { Vec } from '@polkadot/types';
import { FrameSystemEventRecord } from '@polkadot/types/lookup';

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
  PoolFilter,
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

  private blockHandlers: Array<(block: number) => void> = [];
  private eventHandlers: Array<(events: Vec<FrameSystemEventRecord>) => void> =
    [];

  private disconnectSubscribeNewHeads: (() => void) | null = null;
  private disconnectSubscribeEvents: (() => void) | null = null;

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

    this.blockHandlers = this.clients.map((c) => c.onNewBlockHandler);
    this.eventHandlers = this.clients.map((c) => c.onEventsHandler);

    this.api.rpc.chain
      .subscribeNewHeads(async (lastHeader) => {
        const block = lastHeader.number.toNumber();
        this.onNewBlock(block);
      })
      .then((subsFn) => {
        this.disconnectSubscribeNewHeads = subsFn;
      });

    this.api.query.system
      .events((events) => {
        this.onEvents(events);
      })
      .then((subsFn) => {
        this.disconnectSubscribeEvents = subsFn;
      });
  }

  protected onNewBlock(block: number): void {
    this.block = block;
    for (const handler of this.blockHandlers) {
      try {
        handler(block);
      } catch (e) {
        this.log('onNewBlock handler error', e);
      }
    }
  }

  protected onEvents(events: Vec<FrameSystemEventRecord>): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(events);
      } catch (e) {
        this.log('onEvents handler error', e);
      }
    }
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

  async getPools(filter: PoolFilter = {}): Promise<PoolBase[]> {
    if (!this.isRegistrySynced) {
      await this.memRegistry(1);
    }

    const { includeOnly = [], exclude = [] } = filter;

    if (includeOnly.length > 0) {
      return this.getFilteredPools((client) =>
        includeOnly.includes(client.getPoolType())
      );
    }

    if (exclude.length > 0) {
      return this.getFilteredPools(
        (client) => !exclude.includes(client.getPoolType())
      );
    }

    return this.getFilteredPools((client) => client.isSupported());
  }

  private async getFilteredPools(
    supplier: (client: PoolClient) => boolean
  ): Promise<PoolBase[]> {
    const clients = this.clients.filter(supplier);
    const pools = await Promise.all(
      clients.map((client) => client.getPoolsMem())
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
    this.disconnectSubscribeEvents?.();
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
