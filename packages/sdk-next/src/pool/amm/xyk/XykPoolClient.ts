import { CompatibilityLevel } from 'polkadot-api';

import { PoolEventEffect, PoolEventHandler, PoolMutation } from '../../events';
import {
  PoolBase,
  PoolType,
  PoolFee,
  PoolLimits,
  PoolFees,
  PoolToken,
  PoolTokenOverride,
} from '../../types';
import { PoolClient } from '../../PoolClient';

import { XykPoolFees } from './XykPool';

// Composition changes — full reseed (v1).
const STRUCTURAL_EVENTS = new Set(['PoolCreated', 'PoolDestroyed']);

export class XykPoolClient extends PoolClient<PoolBase> {
  private decimals: Map<number, number> = new Map([]);

  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  async withOverride(override?: PoolTokenOverride[]) {
    this.decimals = override
      ? new Map(override.map((p) => [p.id, p.decimals]))
      : new Map();
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.XYK.MaxInRatio(),
      this.api.constants.XYK.MaxOutRatio(),
      this.api.constants.XYK.MinTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.XYK.PoolAssets.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  async loadPools(): Promise<PoolBase[]> {
    const [entries, limits] = await Promise.all([
      this.api.query.XYK.PoolAssets.getEntries({ at: this.at }),
      this.getPoolLimits(),
    ]);

    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const [x, y] = value;

      const [xBalance, xMeta, yBalance, yMeta] = await Promise.all([
        this.balance.getBalance(id, x),
        this.api.query.AssetRegistry.Assets.getValue(x, { at: this.at }),
        this.balance.getBalance(id, y),
        this.api.query.AssetRegistry.Assets.getValue(y, { at: this.at }),
      ]);

      return {
        address: id,
        type: PoolType.XYK,
        tokens: [
          {
            id: x,
            decimals: xMeta?.decimals || this.decimals.get(x),
            existentialDeposit: xMeta?.existential_deposit,
            balance: xBalance.transferable,
            type: xMeta?.asset_type.type,
          } as PoolToken,
          {
            id: y,
            decimals: yMeta?.decimals || this.decimals.get(y),
            existentialDeposit: yMeta?.existential_deposit,
            balance: yBalance.transferable,
            type: yMeta?.asset_type.type,
          } as PoolToken,
        ],
        ...limits,
      } as PoolBase;
    });
    return Promise.all(pools);
  }

  async getPoolFees(): Promise<PoolFees> {
    const exchangeFee = await this.getExchangeFee();
    return {
      exchangeFee: exchangeFee,
    } as XykPoolFees;
  }

  private async getExchangeFee(): Promise<PoolFee> {
    const fee = await this.api.constants.XYK.GetExchangeFee();
    return fee as PoolFee;
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<PoolBase>[] {
    return [this.syncTradeHandler(), this.syncLiquidityHandler()];
  }

  /**
   * Trades — unified `Broadcast.Swapped` (method `Swapped3`) filled by an XYK
   * pool.
   *
   * - `filler` is the pool account (= pool address)
   * - Recompute both token reserves, pinned at the event's block
   */
  private syncTradeHandler(): PoolEventHandler<PoolBase> {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'XYK',
      resolve: (e, block) =>
        this.reserveMutations(e.data.filler as string, block.hash),
    };
  }

  /**
   * Liquidity add/remove — `XYK.LiquidityAdded` / `LiquidityRemoved`.
   *
   * - Event carries the asset pair, not the pool; resolve the pool by its pair
   * - Recompute both token reserves, pinned at the event's block
   */
  private syncLiquidityHandler(): PoolEventHandler<PoolBase> {
    return {
      match: (e) =>
        e.pallet === 'XYK' &&
        (e.method === 'LiquidityAdded' || e.method === 'LiquidityRemoved'),
      resolve: (e, block) => {
        const { asset_a, asset_b } = e.data;
        const pool = this.store.pools.find(
          (p) =>
            p.tokens.length === 2 &&
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
   * Pool created/destroyed — composition change; full reseed (v1).
   */
  private syncStructuralEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'XYK' && STRUCTURAL_EVENTS.has(e.method),
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
   * - Returns one mutation for the pool address
   */
  private async reserveMutations(
    address: string,
    at: string
  ): Promise<PoolMutation<PoolBase>[]> {
    const pool = this.store.pools.find((p) => p.address === address);
    if (!pool) return [];

    const balances = await Promise.all(
      pool.tokens.map(async (t) => ({
        id: t.id,
        balance: (await this.balance.getBalanceAt(address, t.id, at))
          .transferable,
      }))
    );

    return [
      {
        address,
        apply: (p) => ({
          ...p,
          tokens: p.tokens.map((t) => {
            const b = balances.find((x) => x.id === t.id);
            return b ? { ...t, balance: b.balance } : t;
          }),
        }),
      },
    ];
  }
}
