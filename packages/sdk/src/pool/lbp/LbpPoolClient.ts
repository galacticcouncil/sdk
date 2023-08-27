import type { StorageKey } from '@polkadot/types';
import type { AnyTuple } from '@polkadot/types/types';
import type { PalletLbpPool } from '@polkadot/types/lookup';
import type { Option } from '@polkadot/types-codec';
import type { PersistedValidationData } from '@polkadot/types/interfaces/parachains';
import { bnum, scale } from '../../utils/bignumber';
import { PoolBase, PoolFee, PoolFees, PoolLimits, PoolType } from '../../types';

import { LbpMath } from './LbpMath';
import { LbpPoolBase, LbpPoolFees, WeightedPoolToken } from './LbpPool';

import { PoolClient } from '../PoolClient';

export class LbpPoolClient extends PoolClient {
  private readonly MAX_FINAL_WEIGHT = scale(bnum(100), 6);
  private poolsData: Map<string, PalletLbpPool> = new Map([]);
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
    const pools = poolAssets.map(async (asset: [StorageKey<AnyTuple>, Option<PalletLbpPool>]) => {
      const poolAddress = this.getStorageKey(asset, 0);
      const poolEntry = asset[1].unwrap();
      const poolAssets = poolEntry.assets.map((a) => a.toString());
      const poolTokens = await this.getPoolTokens(poolAddress, poolAssets);
      const linearWeight = await this.getLinearWeight(poolEntry);
      const assetAWeight = bnum(linearWeight);
      const assetBWeight = this.MAX_FINAL_WEIGHT.minus(bnum(assetAWeight));
      const accumulatedAsset = poolTokens[0].id;
      this.poolsData.set(poolAddress, poolEntry);
      return {
        address: poolAddress,
        type: PoolType.LBP,
        fee: poolEntry.fee.toJSON() as PoolFee,
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

  private async getLinearWeight(poolEntry: PalletLbpPool): Promise<string> {
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

  private async isRepayFeeApplied(assetKey: string, poolEntry: PalletLbpPool): Promise<boolean> {
    const repayTarget = bnum(poolEntry.repayTarget.toString());
    try {
      const balance = await this.getAccountBalance(assetKey, poolEntry.feeCollector.toString());
      const feeCollectorBalance = balance.amount;
      return feeCollectorBalance.isLessThan(repayTarget);
    } catch (err) {
      // Collector account is empty (No trade has been executed yet)
      return true;
    }
  }

  async getPoolFees(_feeAsset: string, address: string): Promise<PoolFees> {
    const pool = this.pools.find((pool) => pool.address === address) as LbpPoolBase;
    return {
      repayFee: this.getRepayFee(),
      exchangeFee: pool.fee as PoolFee,
    } as LbpPoolFees;
  }

  private getRepayFee(): PoolFee {
    const repayFee = this.api.consts.lbp.repayFee;
    return repayFee.toJSON() as PoolFee;
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.xyk.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.xyk.maxOutRatio.toJSON() as number;
    const minTradingLimit = this.api.consts.xyk.minTradingLimit.toJSON() as number;
    return { maxInRatio: maxInRatio, maxOutRatio: maxOutRatio, minTradingLimit: minTradingLimit } as PoolLimits;
  }
}
