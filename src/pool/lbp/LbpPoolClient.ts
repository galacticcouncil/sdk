import type { StorageKey } from '@polkadot/types';
import type { AnyTuple, Codec } from '@polkadot/types/types';
import type { PersistedValidationData } from '@polkadot/types/interfaces/parachains';
import { bnum, scale } from '../../utils/bignumber';
import { PoolBase, PoolFee, PoolFees, PoolLimits, PoolType } from '../../types';

import { LbpMath } from './LbpMath';
import { LbpPoolFees, WeightedPoolToken } from './LbpPool';

import { PoolClient } from '../PoolClient';

// TODO - use runtime types
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

export class LbpPoolClient extends PoolClient {
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

  private async loadPools(): Promise<PoolBase[]> {
    const poolAssets = await this.api.query.lbp.poolData.entries();
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Codec]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntry = asset[1].toJSON() as unknown as LbpPoolData;
      const poolTokens = await this.getPoolTokens(poolAddress, poolEntry.assets);
      const poolFees = this.getPoolFees(poolEntry);
      const linearWeight = await this.getLinearWeight(poolEntry);
      const assetAWeight = bnum(linearWeight);
      const assetBWeight = this.MAX_FINAL_WEIGHT.minus(bnum(assetAWeight));
      const accumulatedAsset = poolTokens[0].id;
      this.poolsData.set(poolAddress, poolEntry);
      return {
        address: poolAddress,
        type: PoolType.LBP,
        fees: poolFees,
        repayFeeApply: await this.isRepayFeeApplied(accumulatedAsset, poolEntry),
        tokens: [
          { ...poolTokens[0], weight: assetAWeight } as WeightedPoolToken,
          { ...poolTokens[1], weight: assetBWeight } as WeightedPoolToken,
        ],
        ...this.getPoolLimits(),
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  private async syncPools(): Promise<PoolBase[]> {
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
    return LbpMath.calculateLinearWeights(
      poolEntry.start.toString(),
      poolEntry.end.toString(),
      poolEntry.initialWeight.toString(),
      poolEntry.finalWeight.toString(),
      data.relayParentNumber.toString()
    );
  }

  async isRepayFeeApplied(assetKey: string, poolEntry: LbpPoolData): Promise<boolean> {
    const repayTarget = bnum(poolEntry.repayTarget);
    try {
      const balance = await this.getAccountBalance(assetKey, poolEntry.feeCollector);
      const feeCollectorBalance = balance.amount;
      return feeCollectorBalance.isLessThan(repayTarget);
    } catch (err) {
      // Collector account is empty (No trade has been executed yet)
      return true;
    }
  }

  getPoolFees(poolEntry: LbpPoolData): PoolFees {
    return {
      repayFee: this.getRepayFee(),
      exchangeFee: poolEntry.fee as PoolFee,
    } as LbpPoolFees;
  }

  getRepayFee(): PoolFee {
    const repayFee = this.api.consts.lbp.repayFee;
    return repayFee.toJSON() as PoolFee;
  }

  getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.xyk.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.xyk.maxOutRatio.toJSON() as number;
    const minTradingLimit = this.api.consts.xyk.minTradingLimit.toJSON() as number;
    return { maxInRatio: maxInRatio, maxOutRatio: maxOutRatio, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
