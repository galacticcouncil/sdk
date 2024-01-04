import type { u32 } from '@polkadot/types-codec';
import type { PalletLbpPool } from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { bnum, scale } from '../../utils/bignumber';
import { PoolBase, PoolFee, PoolFees, PoolLimits, PoolType } from '../../types';

import { LbpMath } from './LbpMath';
import { LbpPoolBase, LbpPoolFees, WeightedPoolToken } from './LbpPool';

import { PoolClient } from '../PoolClient';

export class LbpPoolClient extends PoolClient {
  private readonly MAX_FINAL_WEIGHT = scale(bnum(100), 6);
  private poolsData: Map<string, PalletLbpPool> = new Map([]);

  isSupported(): boolean {
    return this.api.query.lbp !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const [poolData, validationData] = await Promise.all([
      this.api.query.lbp.poolData.entries(),
      this.api.query.parachainSystem.validationData(),
    ]);

    const { relayParentNumber } = validationData.unwrap();
    const pools = poolData
      .filter(([_, state]) =>
        this.isActivePool(state.unwrap(), relayParentNumber)
      )
      .map(
        async ([
          {
            args: [id],
          },
          state,
        ]) => {
          const poolData: PalletLbpPool = state.unwrap();
          const poolAddress = id.toString();
          const poolDelta = await this.getPoolDelta(
            poolAddress,
            poolData,
            relayParentNumber.toString()
          );

          this.poolsData.set(id.toString(), poolData);
          return {
            address: poolAddress,
            type: PoolType.LBP,
            fee: poolData.fee.toJSON() as PoolFee,
            ...poolDelta,
            ...this.getPoolLimits(),
          } as PoolBase;
        }
      );
    return Promise.all(pools);
  }

  async getPoolFees(_feeAsset: string, address: string): Promise<PoolFees> {
    const pool = this.pools.find(
      (pool) => pool.address === address
    ) as LbpPoolBase;
    return {
      repayFee: this.getRepayFee(),
      exchangeFee: pool.fee as PoolFee,
    } as LbpPoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.LBP;
  }

  async subscribePoolChange(pool: LbpPoolBase): UnsubscribePromise {
    return this.api.query.parachainSystem.validationData(
      async (validationData) => {
        const { relayParentNumber } = validationData.unwrap();
        const poolData = this.poolsData.get(pool.address);
        const isActive = this.isActivePool(poolData!, relayParentNumber);

        if (isActive) {
          const poolDelta = await this.getPoolDelta(
            pool.address,
            poolData!,
            relayParentNumber.toString()
          );

          pool.tokens = poolDelta.tokens ?? pool.tokens;
          pool.repayFeeApply = poolDelta.repayFeeApply ?? pool.repayFeeApply;
        } else {
          const inactivePoolIndex = this.pools.findIndex(
            (p) => p.address == pool.address
          );
          this.pools.splice(inactivePoolIndex, 1);
        }
      }
    );
  }

  private async getPoolDelta(
    poolAddress: string,
    poolEntry: PalletLbpPool,
    relayBlockNumber: string
  ): Promise<Partial<LbpPoolBase>> {
    const {
      start,
      end,
      assets,
      initialWeight,
      finalWeight,
      repayTarget,
      feeCollector,
    } = poolEntry;

    const linearWeight = LbpMath.calculateLinearWeights(
      start.toString(),
      end.toString(),
      initialWeight.toString(),
      finalWeight.toString(),
      relayBlockNumber
    );

    const [accumulated, distributed] = assets;
    const accumulatedAsset = accumulated.toString();
    const accumulatedWeight = bnum(linearWeight);
    const distributedAsset = distributed.toString();
    const distributedWeight = this.MAX_FINAL_WEIGHT.minus(
      bnum(accumulatedWeight)
    );

    const [repayFeeApplied, accumulatedBalance, distributedBalance] =
      await Promise.all([
        this.isRepayFeeApplied(
          accumulatedAsset,
          repayTarget.toString(),
          feeCollector.toString()
        ),
        this.getBalance(poolAddress, accumulatedAsset),
        this.getBalance(poolAddress, distributedAsset),
      ]);

    return {
      repayFeeApply: repayFeeApplied,
      tokens: [
        {
          id: accumulatedAsset,
          weight: accumulatedWeight,
          balance: accumulatedBalance.toString(),
        } as WeightedPoolToken,
        {
          id: distributedAsset,
          weight: distributedWeight,
          balance: distributedBalance.toString(),
        } as WeightedPoolToken,
      ],
    } as Partial<LbpPoolBase>;
  }

  private isActivePool(
    poolEntry: PalletLbpPool,
    relayBlockNumber: u32
  ): boolean {
    if (poolEntry.start.isEmpty || poolEntry.end.isEmpty) {
      return false;
    }

    const start = poolEntry.start.unwrap().toNumber();
    const end = poolEntry.end.unwrap().toNumber();
    return (
      relayBlockNumber.toNumber() >= start && relayBlockNumber.toNumber() < end
    );
  }

  private async isRepayFeeApplied(
    assetKey: string,
    repayTarget: string,
    feeCollector: string
  ): Promise<boolean> {
    const repayFeeTarget = bnum(repayTarget);
    if (repayFeeTarget.isZero()) {
      return false;
    }

    try {
      const repayFeeCurrent = await this.getBalance(assetKey, feeCollector);
      return repayFeeCurrent.isLessThan(repayFeeTarget);
    } catch (err) {
      // Collector account is empty (No trade has been executed yet)
      return true;
    }
  }

  private getRepayFee(): PoolFee {
    const repayFee = this.api.consts.lbp.repayFee;
    return repayFee.toJSON() as PoolFee;
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.lbp.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.lbp.maxOutRatio.toJSON() as number;
    const minTradingLimit =
      this.api.consts.lbp.minTradingLimit.toJSON() as number;
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
