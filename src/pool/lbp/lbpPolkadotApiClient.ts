import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { PersistedValidationData } from '@polkadot/types/interfaces/parachains';
import { PolkadotApiClient } from '../../client';
import { PoolBase, PoolFee, PoolType } from '../../types';
import { bnum, scale } from '../../utils/bignumber';
import { WeightedPoolToken } from './lbpPool';
import math from './lbpMath';

interface LbpPoolData {
  readonly assets: string[];
  readonly feeCollector: string;
  readonly fee: number[];
  readonly repayTarget: string;
  readonly initialWeight: number;
  readonly finalWeight: number;
  readonly start: number;
  readonly end: number;
}

export class LbpPolkadotApiClient extends PolkadotApiClient {
  private readonly MAX_FINAL_WEIGHT = scale(bnum(100), 6);
  private poolsData: Map<string, LbpPoolData> = new Map([]);
  private pools: PoolBase[] = [];
  private _poolsLoaded = false;

  async getPools(): Promise<PoolBase[]> {
    if (this._poolsLoaded) {
      this.pools = await this.syncPools();
    } else {
      this.pools = await this.loadPools();
      this._poolsLoaded = true;
    }
    return this.pools;
  }

  async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.lbp.poolData.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntry = asset[1].toJSON() as unknown as LbpPoolData;
      this.poolsData.set(poolAddress, poolEntry);
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntry.assets);
      const linearWeight = await this.getLinearWeight(poolEntry);
      const assetAWeight = bnum(linearWeight);
      const assetBWeight = this.MAX_FINAL_WEIGHT.minus(bnum(assetAWeight));
      const accumulatedAsset = poolTokens[0].id;
      return {
        address: poolAddress,
        type: PoolType.LBP,
        tradeFee: poolEntry.fee as PoolFee,
        repayFee: this.getRepayFee(),
        repayFeeApply: await this.isRepayFeeApplied(accumulatedAsset, poolEntry),
        tokens: [
          { ...poolTokens[0], weight: assetAWeight } as WeightedPoolToken,
          { ...poolTokens[1], weight: assetBWeight } as WeightedPoolToken,
        ],
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async syncPools(): Promise<PoolBase[]> {
    const syncedPools = this.pools.map(async (pool: PoolBase) => {
      const poolEntry = this.poolsData.get(pool.address);
      const poolTokens = await this.syncPoolTokens(pool.address, pool.tokens);
      const linearWeight = await this.getLinearWeight(poolEntry!);
      const assetAWeight = bnum(linearWeight);
      const assetBWeight = this.MAX_FINAL_WEIGHT.minus(bnum(assetAWeight));
      const accumulatedAsset = poolTokens[0].id;
      return {
        ...pool,
        repayFeeApply: await this.isRepayFeeApplied(accumulatedAsset, poolEntry!),
        tokens: [
          { ...poolTokens[0], weight: assetAWeight } as WeightedPoolToken,
          { ...poolTokens[1], weight: assetBWeight } as WeightedPoolToken,
        ],
      } as PoolBase;
    });
    return Promise.all(syncedPools);
  }

  async getLinearWeight(poolEntry: LbpPoolData): Promise<string> {
    const validationData = await this.api.query.parachainSystem.validationData();
    const data = validationData.toJSON() as unknown as PersistedValidationData;
    return math.calculateLinearWeights(
      poolEntry.start.toString(),
      poolEntry.end.toString(),
      poolEntry.initialWeight.toString(),
      poolEntry.finalWeight.toString(),
      data.relayParentNumber.toString()
    );
  }

  getRepayFee(): PoolFee {
    const repayFee = this.api.consts.lbp.repayFee;
    return repayFee.toJSON() as PoolFee;
  }

  async isRepayFeeApplied(assetKey: string, poolEntry: LbpPoolData): Promise<boolean> {
    const repayTarget = bnum(poolEntry.repayTarget);
    try {
      const balance = await this.getAccountBalance(assetKey, poolEntry.feeCollector);
      const feeCollectorBalance = bnum(balance);
      return feeCollectorBalance.isLessThan(repayTarget);
    } catch (err) {
      // Collector account is empty (No trade has been executed yet)
      return true;
    }
  }
}
