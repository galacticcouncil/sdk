import { AccountId, CompatibilityLevel } from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { TEmaPair } from '../../../oracle';
import { fmt } from '../../../utils';

import {
  BlockRef,
  PoolEventEffect,
  PoolEventHandler,
  PoolMutation,
} from '../../events';
import { PoolType, PoolToken, PoolPair } from '../../types';
import { PoolClient } from '../../PoolClient';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';
import { OmniPoolFee } from './OmniPoolFee';
import { OmniQuery } from './OmniQuery';

import { ORACLE_NAME, ORACLE_PERIOD } from './consts';
import { TOmnipoolAsset } from './types';
import { getEmaPair } from './utils';

const { FeeUtils } = fmt;

// Reserve changes — recompute that asset's slice (balance + state).
const ASSET_EVENTS = new Set([
  'AssetRefunded',
  'AssetWeightCapUpdated',
  'LiquidityAdded',
  'LiquidityRemoved',
  'ProtocolLiquidityRemoved',
  'TradableStateUpdated',
]);

// Composition changes — full reseed (v1).
const STRUCTURAL_EVENTS = new Set(['TokenAdded', 'TokenRemoved']);

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  protected readonly query = new OmniQuery(this.client, this.evm);

  private poolAddress = this.getPoolAddress();

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  private getPoolAddress() {
    const name = 'modlomnipool'.padEnd(32, '\0');
    const nameU8a = new TextEncoder().encode(name);
    const nameHex = toHex(nameU8a);
    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.Omnipool.Assets.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  protected async loadPools(block: BlockRef): Promise<OmniPoolBase[]> {
    const at = block.hash;
    const hubAssetId = await this.query.hubAssetId();
    const poolAddress = this.getPoolAddress();

    const [
      entries,
      hubAssetTradeability,
      hubAssetMeta,
      hubAssetBalance,
      limits,
    ] = await Promise.all([
      this.query.assets.get(at),
      this.query.hubTradability.get(at),
      this.query.asset.get(at, hubAssetId),
      this.query.assetBalance.get(at, poolAddress, hubAssetId),
      this.query.limits(),
    ]);

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;

      const [meta, balance] = await Promise.all([
        this.query.asset.get(at, id),
        this.query.assetBalance.get(at, poolAddress, id),
      ]);

      return {
        id: id,
        decimals: meta?.decimals,
        existentialDeposit: meta?.existential_deposit,
        balance: balance.transferable,
        cap: cap,
        hubReserves: hub_reserve,
        protocolShares: protocol_shares,
        shares: shares,
        tradeable: tradable,
        type: meta?.asset_type.type,
      } as OmniPoolToken;
    });

    const tokens = await Promise.all(poolTokens);

    // Adding LRNA info
    tokens.push({
      id: hubAssetId,
      decimals: hubAssetMeta?.decimals,
      existentialDeposit: hubAssetMeta?.existential_deposit,
      balance: hubAssetBalance.transferable,
      tradeable: hubAssetTradeability,
      type: hubAssetMeta?.asset_type.type,
    } as OmniPoolToken);

    return [
      {
        address: poolAddress,
        type: PoolType.Omni,
        hubAssetId: hubAssetId,
        tokens: tokens,
        ...limits,
      } as OmniPoolBase,
    ];
  }

  async getPoolFees(pair: PoolPair): Promise<OmniPoolFees> {
    const feeAsset = pair.assetOut;
    const protocolAsset = pair.assetIn;
    const at = this.blockHash ?? this.at;

    const slipFee = await this.query.maxSlipFee.get(at);
    const maxSlipFee = slipFee ?? 0;

    const feeConfiguration = await this.query.dynamicFeesConfig.get(
      at,
      feeAsset
    );
    if (feeConfiguration?.type === 'Fixed') {
      const { asset_fee, protocol_fee } = feeConfiguration.value;
      return {
        assetFee: FeeUtils.fromPermill(asset_fee),
        protocolFee: FeeUtils.fromPermill(protocol_fee),
        maxSlipFee: FeeUtils.fromPermill(maxSlipFee),
      };
    }

    const [
      dynamicFee,
      oracleAssetFee,
      oracleProtocolFee,
      assetFeeParams,
      protocolFeeParams,
    ] = await Promise.all([
      this.query.dynamicFees.get(at, feeAsset),
      this.query.emaOracles.get(at, getEmaPair(feeAsset)),
      this.query.emaOracles.get(at, getEmaPair(protocolAsset)),
      feeConfiguration
        ? feeConfiguration.value.asset_fee_params
        : this.query.assetFeeParams(),
      feeConfiguration
        ? feeConfiguration.value.protocol_fee_params
        : this.query.protocolFeeParams(),
    ]);

    return OmniPoolFee.compute(
      pair,
      this.block,
      dynamicFee,
      oracleAssetFee,
      oracleProtocolFee,
      assetFeeParams,
      protocolFeeParams,
      maxSlipFee
    );
  }

  // =============================================================================
  // Handlers
  // =============================================================================

  protected syncHandlers(): PoolEventHandler<OmniPoolBase>[] {
    return [this.syncTradeHandler(), this.syncAssetHandler()];
  }

  /**
   * Trades — unified `Broadcast.Swapped` (method `Swapped3`) this omnipool filled.
   *
   * - Recompute every asset moved in/out, pinned at the event's block
   */
  private syncTradeHandler(): PoolEventHandler<OmniPoolBase> {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'Omnipool',
      resolve: (e, block) => {
        const ids = new Set<number>();
        for (const io of [
          ...(e.data.inputs ?? []),
          ...(e.data.outputs ?? []),
        ]) {
          ids.add(io.asset);
        }
        this.log.trace('trade', { assets: [...ids] });
        return this.assetMutations([...ids], block.hash);
      },
    };
  }

  /**
   * Liquidity + per-asset config — recompute reserves/state of the named
   * asset, pinned at the event's block.
   *
   * - Also re-reads the hub asset: liquidity mints/burns hub reserve, so the
   *   pool's hub balance moves without the event naming it (trades name it)
   */
  private syncAssetHandler(): PoolEventHandler<OmniPoolBase> {
    return {
      match: (e) => e.pallet === 'Omnipool' && ASSET_EVENTS.has(e.method),
      resolve: (e, block) => {
        const [pool] = this.store.pools;
        this.log.trace(e.method.toLowerCase(), { asset: e.data.asset_id });
        return this.assetMutations(
          [e.data.asset_id, pool.hubAssetId],
          block.hash
        );
      },
    };
  }

  // =============================================================================
  // Effects
  // =============================================================================

  protected syncEffects(): PoolEventEffect[] {
    return [
      this.syncStructuralEffect(),
      this.syncSlipFeeEffect(),
      this.syncEmaOracleEffect(),
      this.syncDynamicFeeEffect(),
      this.syncFeeConfigEffect(),
    ];
  }

  /**
   * Composition change (token added/removed) — full reseed (cheap, rare, v1).
   */
  private syncStructuralEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'Omnipool' && STRUCTURAL_EVENTS.has(e.method),
      apply: async (e) => {
        this.log.debug('pool_resync', { event: e.method });
        this.requestResync();
      },
    };
  }

  /**
   * Slip fee — refresh the fee-input cache.
   */
  private syncSlipFeeEffect(): PoolEventEffect {
    return {
      match: (e) => e.pallet === 'Omnipool' && e.method === 'SlipFeeSet',
      apply: async (e) => {
        this.query.maxSlipFee.set(e.data.slip_fee);
      },
    };
  }

  /**
   * EMA oracle cache — refresh on `OracleUpdated`.
   *
   * - The event names the (source, pair) that moved
   * - Read the Short entry at the event's block
   * - The event carries price only; the dynamic fee needs volume/liquidity
   */
  private syncEmaOracleEffect(): PoolEventEffect {
    const [pool] = this.store.pools;
    const wanted = new Set(pool.tokens.map((t) => getEmaPair(t.id).join(':')));
    return {
      match: (e) =>
        e.pallet === 'EmaOracle' &&
        e.method === 'OracleUpdated' &&
        e.data.source === ORACLE_NAME &&
        wanted.has((e.data.assets as TEmaPair).join(':')),
      apply: async (e, block) => {
        const pair = e.data.assets as TEmaPair;
        const entry = await this.api.query.EmaOracle.Oracles.getValue(
          ORACLE_NAME,
          pair,
          ORACLE_PERIOD,
          { at: block.hash }
        );
        if (entry) {
          this.query.emaOracles.set(entry, pair);
          this.log.trace('ema', { pair });
        }
      },
    };
  }

  /**
   * Dynamic fee cache — recomputed on-chain per trade for the traded assets.
   *
   * - Warms `DynamicFees.AssetFee` at the event's block so a later quote reads
   *   it without a round trip
   * - Goes through the block-scoped cache, so every hop naming an asset shares
   *   one read, and the entry can't outlive its block
   */
  private syncDynamicFeeEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'Broadcast' &&
        e.method === 'Swapped3' &&
        e.data?.filler_type?.type === 'Omnipool',
      apply: async (e, block) => {
        const ids = new Set<number>();
        for (const io of [
          ...(e.data.inputs ?? []),
          ...(e.data.outputs ?? []),
        ]) {
          ids.add(io.asset);
        }
        await Promise.all(
          [...ids].map((id) => this.query.dynamicFees.get(block.hash, id))
        );
      },
    };
  }

  /**
   * Fee-config cache invalidation — rare governance change; re-read lazily on
   * the next `getPoolFees`.
   */
  private syncFeeConfigEffect(): PoolEventEffect {
    return {
      match: (e) =>
        e.pallet === 'DynamicFees' &&
        (e.method === 'AssetFeeConfigSet' ||
          e.method === 'AssetFeeConfigRemoved'),
      apply: async () => {
        this.query.dynamicFeesConfig.clear();
      },
    };
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Resolve the omnipool slice for the given assets
   *
   * - Reads balance + state together so the implied price can't tear
   * - Returns a single mutation (one omnipool address)
   */
  private async assetMutations(
    assetIds: number[],
    at: string
  ): Promise<PoolMutation<OmniPoolBase>[]> {
    const slices = await Promise.all(
      assetIds.map(async (id) => {
        const [bal, state] = await Promise.all([
          this.query.assetBalance.get(at, this.poolAddress, id),
          this.query.assetState.get(at, id),
        ]);
        return { id, balance: bal.transferable, state };
      })
    );

    return [
      {
        address: this.poolAddress,
        apply: (pool) => ({
          ...pool,
          tokens: pool.tokens.map((t) => {
            const slice = slices.find((s) => s.id === t.id);
            if (!slice) return t;
            const next = { ...t, balance: slice.balance } as OmniPoolToken;
            return slice.state
              ? this.updateTokenState(next, slice.state)
              : next;
          }),
        }),
      },
    ];
  }

  private updateTokenState(token: PoolToken, state: TOmnipoolAsset) {
    const { hub_reserve, shares, tradable, cap, protocol_shares } = state;
    return {
      ...token,
      cap: cap,
      hubReserves: hub_reserve,
      protocolShares: protocol_shares,
      shares: shares,
      tradeable: tradable,
    } as OmniPoolToken;
  }
}
