import { LbpPoolClient } from './lbp/LbpPoolClient';
import { OmniPoolClient } from './omni/OmniPoolClient';
import { XykPoolClient } from './xyk/XykPoolClient';
import { StableSwapClient } from './stable/StableSwapClient';
import { buildRoute } from './PoolUtils';

import { AssetClient } from '../client';
import { PoolNotFound } from '../errors';
import {
  Hop,
  PoolBase,
  IPoolService,
  PoolType,
  Transaction,
  PoolFees,
  Pool,
  AssetMetadata,
} from '../types';
import { BigNumber } from '../utils/bignumber';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

export class PoolService implements IPoolService {
  protected readonly api: ApiPromise;
  protected readonly assetClient: AssetClient;

  protected readonly xykClient: XykPoolClient;
  protected readonly omniClient: OmniPoolClient;
  protected readonly lbpClient: LbpPoolClient;
  protected readonly stableClient: StableSwapClient;

  protected metadata: AssetMetadata[] = [];
  protected metadataLoaded = false;

  constructor(api: ApiPromise) {
    this.api = api;
    this.assetClient = new AssetClient(this.api);
    this.xykClient = new XykPoolClient(this.api);
    this.omniClient = new OmniPoolClient(this.api);
    this.lbpClient = new LbpPoolClient(this.api);
    this.stableClient = new StableSwapClient(this.api);
  }

  async getPools(includeOnly: PoolType[]): Promise<PoolBase[]> {
    if (!this.metadataLoaded) {
      this.metadata = await this.assetClient.getOnChainMetadata();
      this.metadataLoaded = true;
    }

    if (includeOnly.length == 0) {
      const pools = await Promise.all([
        this.xykClient.getPools(),
        this.omniClient.getPools(),
        this.lbpClient.getPools(),
        this.stableClient.getPools(),
      ]);
      const flatten = pools.flat();
      return this.withMetadata(flatten);
    }

    const poolList: Promise<PoolBase[]>[] = [];
    includeOnly.forEach((poolType: PoolType) => {
      switch (poolType) {
        case PoolType.XYK:
          poolList.push(this.xykClient.getPools());
          break;
        case PoolType.Omni:
          poolList.push(this.omniClient.getPools());
          break;
        case PoolType.LBP:
          poolList.push(this.lbpClient.getPools());
          break;
        case PoolType.Stable:
          poolList.push(this.stableClient.getPools());
          break;
      }
    });

    const pools = await Promise.all(poolList);
    const flatten = pools.flat();
    return this.withMetadata(flatten);
  }

  unsubscribe() {
    this.xykClient.unsubscribe();
    this.omniClient.unsubscribe();
    this.lbpClient.unsubscribe();
    this.stableClient.unsubscribe();
  }

  private async withMetadata(pools: PoolBase[]): Promise<PoolBase[]> {
    const metaMap: Map<string, AssetMetadata> = new Map(
      this.metadata.map((m) => [m.id, m])
    );

    return pools.map((pool: PoolBase) => {
      const tokens = pool.tokens.map((t) => {
        const meta = metaMap.get(t.id);
        return {
          ...t,
          ...meta,
        };
      });
      return {
        ...pool,
        tokens,
      };
    });
  }

  async getPoolFees(feeAsset: string, pool: Pool): Promise<PoolFees> {
    switch (pool.type) {
      case PoolType.XYK:
        return this.xykClient.getPoolFees(feeAsset, pool.address);
      case PoolType.Omni:
        return this.omniClient.getPoolFees(feeAsset, pool.address);
      case PoolType.LBP:
        return this.lbpClient.getPoolFees(feeAsset, pool.address);
      case PoolType.Stable:
        return this.stableClient.getPoolFees(feeAsset, pool.address);
      default:
        throw new PoolNotFound(pool.type);
    }
  }

  private isDirectOmnipoolTrade(route: Hop[]) {
    return route.length == 1 && route[0].pool == PoolType.Omni;
  }

  buildBuyTx(
    assetIn: string,
    assetOut: string,
    amountOut: BigNumber,
    maxAmountIn: BigNumber,
    route: Hop[]
  ): Transaction {
    let tx: SubmittableExtrinsic;

    // In case of direct trade in omnipool we skip router (cheaper tx)
    if (this.isDirectOmnipoolTrade(route)) {
      tx = this.api.tx.omnipool.buy(
        assetOut,
        assetIn,
        amountOut.toFixed(),
        maxAmountIn.toFixed()
      );
    } else {
      tx = this.api.tx.router.buy(
        assetIn,
        assetOut,
        amountOut.toFixed(),
        maxAmountIn.toFixed(),
        buildRoute(route)
      );
    }

    const getTx = (): SubmittableExtrinsic => {
      return tx;
    };
    return { hex: tx.toHex(), name: 'RouterBuy', get: getTx } as Transaction;
  }

  buildSellTx(
    assetIn: string,
    assetOut: string,
    amountIn: BigNumber,
    minAmountOut: BigNumber,
    route: Hop[]
  ): Transaction {
    let tx: SubmittableExtrinsic;

    // In case of direct trade in omnipool we skip router (cheaper tx)
    if (this.isDirectOmnipoolTrade(route)) {
      tx = this.api.tx.omnipool.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed()
      );
    } else {
      tx = this.api.tx.router.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed(),
        buildRoute(route)
      );
    }

    const getTx = (): SubmittableExtrinsic => {
      return tx;
    };
    return { hex: tx.toHex(), name: 'RouterSell', get: getTx } as Transaction;
  }
}
