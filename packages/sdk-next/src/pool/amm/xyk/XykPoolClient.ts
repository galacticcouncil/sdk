import { CompatibilityLevel } from 'polkadot-api';

import { BlockRef } from '../../../api';

import {
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from '../../events';
import {
  PoolBase,
  PoolType,
  PoolFees,
  PoolToken,
  PoolTokenOverride,
} from '../../types';
import { PoolClient } from '../../PoolClient';

import { XykPoolFees } from './XykPool';
import { XykQuery } from './XykQuery';

// Composition changes — full reseed (v1).
const STRUCTURAL_EVENTS = new Set(['PoolCreated', 'PoolDestroyed']);

export class XykPoolClient extends PoolClient<PoolBase> {
  protected readonly query = new XykQuery(this.client, this.evm);

  private decimals: Map<number, number> = new Map([]);

  getPoolType(): PoolType {
    return PoolType.XYK;
  }

  async withOverride(override?: PoolTokenOverride[]) {
    this.decimals = override
      ? new Map(override.map((p) => [p.id, p.decimals]))
      : new Map();
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.XYK.PoolAssets.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  async loadPools(block: BlockRef): Promise<PoolBase[]> {
    const at = block.hash;
    const [entries, assets, limits] = await Promise.all([
      this.query.poolAssets.get(at),
      this.query.assets.get(at),
      this.query.limits(),
    ]);

    const pools = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const [x, y] = value;

      const xMeta = assets.get(x);
      const yMeta = assets.get(y);

      const [xBalance, yBalance] = await Promise.all([
        this.query.assetBalance.get(at, id, x),
        this.query.assetBalance.get(at, id, y),
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
    const exchangeFee = await this.query.exchangeFee();
    return {
      exchangeFee: exchangeFee,
    } as XykPoolFees;
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
      apply: async (e) => {
        this.log.debug('pool_resync', { event: e.method });
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
        balance: (await this.query.assetBalance.get(at, address, t.id))
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
