import { CompatibilityLevel } from 'polkadot-api';
import { HydrationQueries } from '@galacticcouncil/descriptors';

import { type Observable, map, of, switchMap } from 'rxjs';

import { PoolType, PoolLimits, PoolFees, PoolFee, PoolPair } from '../types';
import { PoolClient } from '../PoolClient';

import { LbpMath } from './LbpMath';
import { LbpPoolBase, LbpPoolFees, WeightedPoolToken } from './LbpPool';

type TLbpPoolData = HydrationQueries['LBP']['PoolData']['Value'];

export class LbpPoolClient extends PoolClient<LbpPoolBase> {
  private readonly MAX_FINAL_WEIGHT = 100_000_000n;
  private poolsData: Map<string, TLbpPoolData> = new Map([]);

  protected async loadPools(): Promise<LbpPoolBase[]> {
    const [entries, validationData, limits] = await Promise.all([
      this.api.query.LBP.PoolData.getEntries(),
      this.api.query.ParachainSystem.ValidationData.getValue(),
      this.getPoolLimits(),
    ]);

    const relayParentNumber = validationData?.relay_parent_number || 0;
    const pools = entries
      .filter(
        ({ value }) =>
          validationData && this.isActivePool(value, relayParentNumber)
      )
      .map(async ({ keyArgs, value }) => {
        const [id] = keyArgs;
        const poolAddress = id.toString();
        const poolDelta = await this.getPoolDelta(
          poolAddress,
          value,
          relayParentNumber
        );

        return {
          address: poolAddress,
          type: PoolType.LBP,
          fee: value.fee as PoolFee,
          ...poolDelta,
          ...limits,
        } as LbpPoolBase;
      });
    return Promise.all(pools);
  }

  private async getPoolDelta(
    poolAddress: string,
    poolEntry: TLbpPoolData,
    relayBlockNumber: number
  ): Promise<Partial<LbpPoolBase>> {
    const {
      start,
      end,
      assets,
      initial_weight,
      final_weight,
      repay_target,
      fee_collector,
    } = poolEntry;

    const linearWeight = LbpMath.calculateLinearWeights(
      start ? start.toString() : '0',
      end ? end.toString() : '0',
      initial_weight.toString(),
      final_weight.toString(),
      relayBlockNumber.toString()
    );

    const [accumulated, distributed] = assets;
    const accumulatedWeight = BigInt(linearWeight);
    const distributedWeight = this.MAX_FINAL_WEIGHT - BigInt(accumulatedWeight);

    const [
      repayFeeApplied,
      accumulatedBalance,
      accumulatedMeta,
      distributedBalance,
      distributedMeta,
    ] = await Promise.all([
      this.isRepayFeeApplied(
        accumulated,
        repay_target,
        fee_collector.toString()
      ),
      this.getBalance(poolAddress, accumulated),
      this.api.query.AssetRegistry.Assets.getValue(accumulated),
      this.getBalance(poolAddress, distributed),
      this.api.query.AssetRegistry.Assets.getValue(distributed),
    ]);

    return {
      repayFeeApply: repayFeeApplied,
      tokens: [
        {
          id: accumulated,
          decimals: accumulatedMeta?.decimals,
          existentialDeposit: accumulatedMeta?.existential_deposit,
          balance: accumulatedBalance.transferable,
          weight: accumulatedWeight,
          type: accumulatedMeta?.asset_type.type,
        } as WeightedPoolToken,
        {
          id: distributed,
          decimals: distributedMeta?.decimals,
          existentialDeposit: distributedMeta?.existential_deposit,
          balance: distributedBalance.transferable,
          weight: distributedWeight,
          type: distributedMeta?.asset_type.type,
        } as WeightedPoolToken,
      ],
    } as Partial<LbpPoolBase>;
  }

  private isActivePool(
    poolEntry: TLbpPoolData,
    relayBlockNumber: number
  ): boolean {
    const { start, end } = poolEntry;
    if (start && end) {
      return relayBlockNumber >= start && relayBlockNumber < end;
    }
    return false;
  }

  private async isRepayFeeApplied(
    accumulatedAsset: number,
    repayTarget: bigint,
    feeCollector: string
  ): Promise<boolean> {
    if (repayTarget === 0n) {
      return false;
    }

    try {
      const repayFeeCurrent = await this.getBalance(
        feeCollector,
        accumulatedAsset
      );
      return repayFeeCurrent.transferable < repayTarget;
    } catch (err) {
      // Collector account is empty (No trade has been executed yet)
      return true;
    }
  }

  private async getRepayFee(): Promise<PoolFee> {
    const repayFee = await this.api.constants.LBP.repay_fee();
    return repayFee as PoolFee;
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.LBP.MaxInRatio(),
      this.api.constants.LBP.MaxOutRatio(),
      this.api.constants.LBP.MinTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  async getPoolFees(_pair: PoolPair, address: string): Promise<PoolFees> {
    const pool = this.store.pools.find(
      (pool) => pool.address === address
    ) as LbpPoolBase;

    const repayFee = await this.getRepayFee();
    return {
      repayFee: repayFee,
      exchangeFee: pool.fee as PoolFee,
    } as LbpPoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.LBP;
  }

  async isSupported(): Promise<boolean> {
    const query = this.api.query.LBP.PoolData;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  subscribePoolChange(pool: LbpPoolBase): Observable<LbpPoolBase> {
    const query = this.api.query.ParachainSystem.ValidationData;
    const poolData = this.poolsData.get(pool.address);

    if (!poolData) {
      return of(pool);
    }

    return query.watchValue('best').pipe(
      switchMap((data) => {
        if (data) {
          return this.getPoolDelta(
            pool.address,
            poolData,
            data.relay_parent_number
          );
        }
        return of(pool);
      }),
      map((delta) => Object.assign({}, pool, delta))
    );
  }
}
