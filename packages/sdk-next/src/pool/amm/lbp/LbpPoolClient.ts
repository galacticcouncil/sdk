import { CompatibilityLevel } from 'polkadot-api';

import {
  BlockRef,
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from '../../events';
import { PoolType, PoolLimits, PoolFees, PoolFee, PoolPair } from '../../types';
import { PoolClient } from '../../PoolClient';

import { LbpMath } from './LbpMath';
import { LbpPoolBase, LbpPoolFees, WeightedPoolToken } from './LbpPool';

import { TLbpPoolData } from './types';

// Composition/param changes — full reseed (v1). `LiquidityRemoved` destroys the pool.
const STRUCTURAL_EVENTS = new Set([
  'PoolCreated',
  'PoolUpdated',
  'LiquidityRemoved',
]);

export class LbpPoolClient extends PoolClient<LbpPoolBase> {
  private readonly MAX_FINAL_WEIGHT = 100_000_000n;

  private poolsData: Map<string, TLbpPoolData> = new Map([]);

  getPoolType(): PoolType {
    return PoolType.LBP;
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

  private getPoolWeights(
    poolEntry: TLbpPoolData,
    relayBlockNumber: number
  ): [bigint, bigint] {
    const { start, end, initial_weight, final_weight } = poolEntry;

    const linearWeight = LbpMath.calculateLinearWeights(
      start ? start.toString() : '0',
      end ? end.toString() : '0',
      initial_weight.toString(),
      final_weight.toString(),
      relayBlockNumber.toString()
    );

    const accumulatedWeight = BigInt(linearWeight);
    const distributedWeight = this.MAX_FINAL_WEIGHT - BigInt(accumulatedWeight);

    return [accumulatedWeight, distributedWeight];
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.LBP.PoolData.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  protected async loadPools(): Promise<LbpPoolBase[]> {
    const [entries, validationData, limits] = await Promise.all([
      this.api.query.LBP.PoolData.getEntries({ at: this.at }),
      this.api.query.ParachainSystem.ValidationData.getValue({ at: this.at }),
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

        this.poolsData.set(poolAddress, value);
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
    const { assets, repay_target, fee_collector } = poolEntry;
    const [accumulatedWeight, distributedWeight] = this.getPoolWeights(
      poolEntry,
      relayBlockNumber
    );
    const [accumulated, distributed] = assets;

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
        fee_collector.toString(),
        this.at
      ),
      this.balance.getBalance(poolAddress, accumulated),
      this.api.query.AssetRegistry.Assets.getValue(accumulated, {
        at: this.at,
      }),
      this.balance.getBalance(poolAddress, distributed),
      this.api.query.AssetRegistry.Assets.getValue(distributed, {
        at: this.at,
      }),
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
    feeCollector: string,
    at: string
  ): Promise<boolean> {
    if (repayTarget === 0n) {
      return false;
    }

    try {
      const repayFeeCurrent = await this.balance.getBalanceAt(
        feeCollector,
        accumulatedAsset,
        at
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

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<LbpPoolBase>[] {
    return [this.syncTradeHandler(), this.syncLiquidityHandler()];
  }

  /**
   * Trades — unified `Broadcast.Swapped` (method `Swapped3`) filled by an LBP
   * pool.
   *
   * - `filler` is the pool account (= pool address)
   * - Recompute both reserves + `repayFeeApply`, pinned at the event's block
   */
  private syncTradeHandler(): PoolEventHandler<LbpPoolBase> {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'LBP',
      resolve: (e, block) =>
        this.reserveMutations(e.data.filler as string, block.hash),
    };
  }

  /**
   * Liquidity added — `LBP.LiquidityAdded`.
   *
   * - Event carries the asset pair, not the pool; resolve the pool by its pair
   * - Recompute both reserves + `repayFeeApply`, pinned at the event's block
   */
  private syncLiquidityHandler(): PoolEventHandler<LbpPoolBase> {
    return {
      match: (e) => e.pallet === 'LBP' && e.method === 'LiquidityAdded',
      resolve: (e, block) => {
        const { asset_a, asset_b } = e.data;
        const pool = this.store.pools.find((p) =>
          p.tokens.every((t) => t.id === asset_a || t.id === asset_b)
        );
        if (!pool) return Promise.resolve([]);
        return this.reserveMutations(pool.address, block.hash);
      },
    };
  }

  // =============================================================================
  // Effects
  // =============================================================================

  protected syncEffects(): PoolEventEffect[] {
    return [this.syncStructuralEffect()];
  }

  /**
   * Pool created/updated/removed — composition or schedule change; full reseed (v1).
   */
  private syncStructuralEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'LBP' && STRUCTURAL_EVENTS.has(e.method),
      apply: async () => {
        this.requestResync();
      },
    };
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Resolve a pool's reserve slice, PINNED at `at` (the event's block hash).
   *
   * - Re-reads both token balances so the implied price can't tear
   * - Re-reads `repayFeeApply` (fee collector balance vs repay target)
   * - Leaves weights to the per-block tick
   */
  private async reserveMutations(
    address: string,
    at: string
  ): Promise<PoolMutation<LbpPoolBase>[]> {
    const data = this.poolsData.get(address);
    if (!data) return [];

    const { assets, repay_target, fee_collector } = data;
    const [accumulated, distributed] = assets;

    const [accBal, distBal, repayFeeApplied] = await Promise.all([
      this.balance.getBalanceAt(address, accumulated, at),
      this.balance.getBalanceAt(address, distributed, at),
      this.isRepayFeeApplied(
        accumulated,
        repay_target,
        fee_collector.toString(),
        at
      ),
    ]);

    return [
      {
        address,
        apply: (pool) => {
          const [acc, dist] = pool.tokens;
          return {
            ...pool,
            repayFeeApply: repayFeeApplied,
            tokens: [
              { ...acc, balance: accBal.transferable },
              { ...dist, balance: distBal.transferable },
            ],
          };
        },
      },
    ];
  }

  /**
   * Weight recalc — LBP weights ramp with the relay chain block.
   *
   * - Read the relay parent number at the event's block
   * - Recompute each pool's accumulated/distributed weights (pure WASM)
   */
  protected async tickMutations(
    block: BlockRef
  ): Promise<PoolMutation<LbpPoolBase>[]> {
    if (this.store.pools.length === 0) return [];

    const validationData =
      await this.api.query.ParachainSystem.ValidationData.getValue({
        at: block.hash,
      });
    const relay = validationData?.relay_parent_number;
    if (relay === undefined) return [];

    const muts: PoolMutation<LbpPoolBase>[] = [];
    for (const pool of this.store.pools) {
      const data = this.poolsData.get(pool.address);
      if (!data) continue;

      const [accWeight, distWeight] = this.getPoolWeights(data, relay);
      muts.push({
        address: pool.address,
        apply: (p) => {
          const [acc, dist] = p.tokens;
          return {
            ...p,
            tokens: [
              { ...acc, weight: accWeight },
              { ...dist, weight: distWeight },
            ],
          };
        },
      });
    }
    return muts;
  }
}
