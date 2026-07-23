import {
  AccountId,
  Binary,
  CompatibilityLevel,
  Enum,
  SizedHex,
} from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { PoolClient } from '../../PoolClient';
import { PoolType, PoolLimits, PoolToken, PoolPair } from '../../types';
import { PoolEventEffect, PoolEventHandler, PoolMutation } from '../../events';

import { TEmaOracle, TEmaPair } from '../../../oracle';
import { fmt, QueryBus } from '../../../utils';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';
import { OmniPoolFee } from './OmniPoolFee';
import {
  TDynamicFees,
  TDynamicFeesConfig,
  TOmnipoolAsset,
  TSlipFee,
} from './types';
import { getEmaPair } from './utils';

const { FeeUtils } = fmt;

const ORACLE_NAME = Binary.toHex(Binary.fromText('omnipool')) as SizedHex<8>;
const ORACLE_PERIOD = Enum('Short');

// Reserve changes — recompute that asset's slice (balance + state).
const ASSET_EVENTS = new Set([
  'LiquidityAdded',
  'LiquidityRemoved',
  'ProtocolLiquidityRemoved',
  'AssetRefunded',
  'TradableStateUpdated',
  'AssetWeightCapUpdated',
]);

// Composition changes — full reseed (v1).
const STRUCTURAL_EVENTS = new Set(['TokenAdded', 'TokenRemoved']);

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  private queryBus = new QueryBus();
  private poolAddress = this.getPoolAddress();

  private dynamicFeesConfig = this.queryBus.scope<
    [number],
    TDynamicFeesConfig | undefined
  >(
    'DynamicFees.AssetFeeConfiguration',
    (id) =>
      this.api.query.DynamicFees.AssetFeeConfiguration.getValue(id, {
        at: this.at,
      }),
    (id) => String(id)
  );

  private dynamicFees = this.queryBus.scope<[number], TDynamicFees | undefined>(
    'DynamicFees.AssetFee',
    (id) => this.api.query.DynamicFees.AssetFee.getValue(id, { at: this.at }),
    (id) => String(id),
    6 * 1000
  );

  private maxSlipFee = this.queryBus.scope<[], TSlipFee | undefined>(
    'Omnipool.SlipFee',
    () => this.apiNext.query.Omnipool.SlipFee.getValue({ at: this.at }),
    () => String('slipFee')
  );

  private emaOracles = this.queryBus.scope<[TEmaPair], TEmaOracle | undefined>(
    'EmaOracle.Oracles.Short',
    (pair) =>
      this.api.query.EmaOracle.Oracles.getValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD,
        { at: this.at }
      ),
    (pair) => pair.join(':'),
    6 * 1000
  );

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  private getPoolAddress() {
    const name = 'modlomnipool'.padEnd(32, '\0');
    const nameU8a = new TextEncoder().encode(name);
    const nameHex = toHex(nameU8a);
    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  }

  private async getPoolLimits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.Omnipool.MaxInRatio(),
      this.api.constants.Omnipool.MaxOutRatio(),
      this.api.constants.Omnipool.MinimumTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  async isSupported(): Promise<boolean> {
    const staticApis = await this.api.getStaticApis();
    return staticApis.compat.query.Omnipool.Assets.isCompatible(
      CompatibilityLevel.BackwardsCompatible
    );
  }

  protected async loadPools(): Promise<OmniPoolBase[]> {
    const hubAssetId = await this.api.constants.Omnipool.HubAssetId();
    const poolAddress = this.getPoolAddress();

    const [
      entries,
      hubAssetTradeability,
      hubAssetMeta,
      hubAssetBalance,
      limits,
      block,
    ] = await Promise.all([
      this.api.query.Omnipool.Assets.getEntries({ at: this.at }),
      this.api.query.Omnipool.HubAssetTradability.getValue({ at: this.at }),
      this.api.query.AssetRegistry.Assets.getValue(hubAssetId, { at: this.at }),
      this.balance.getBalance(poolAddress, hubAssetId),
      this.getPoolLimits(),
      this.api.query.System.Number.getValue({ at: this.at }),
    ]);

    this.block = block;

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;

      const [meta, balance] = await Promise.all([
        this.api.query.AssetRegistry.Assets.getValue(id, { at: this.at }),
        this.balance.getBalance(poolAddress, id),
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

    const slipFee = await this.maxSlipFee.get();
    const maxSlipFee = slipFee ?? 0;

    const feeConfiguration = await this.dynamicFeesConfig.get(feeAsset);
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
      this.dynamicFees.get(feeAsset),
      this.emaOracles.get(getEmaPair(feeAsset)),
      this.emaOracles.get(getEmaPair(protocolAsset)),
      feeConfiguration
        ? feeConfiguration.value.asset_fee_params
        : this.api.constants.DynamicFees.AssetFeeParameters(),
      feeConfiguration
        ? feeConfiguration.value.protocol_fee_params
        : this.api.constants.DynamicFees.ProtocolFeeParameters(),
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
   * Trades — unified `Broadcast.Swapped` (method `Swapped3`) this omnipool
   * filled; recompute every asset moved in/out, pinned at the event's block.
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
        return this.omniAssetMutations([...ids], block.hash);
      },
    };
  }

  /**
   * Liquidity + per-asset config — recompute reserves/state of the named
   * asset, pinned at the event's block.
   */
  private syncAssetHandler(): PoolEventHandler<OmniPoolBase> {
    return {
      match: (e) => e.pallet === 'Omnipool' && ASSET_EVENTS.has(e.method),
      resolve: (e, block) =>
        this.omniAssetMutations([e.data.asset_id], block.hash),
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
      apply: async () => {
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
        this.maxSlipFee.set(e.data.slip_fee);
      },
    };
  }

  /**
   * EMA oracle cache — `OracleUpdated` names the (source, pair) that moved; read
   * the Short entry at the event's block (the event carries price only, the
   * dynamic fee needs volume/liquidity).
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
          this.emaOracles.set(entry, pair);
        }
      },
    };
  }

  /**
   * Dynamic fee cache — recomputed on-chain per trade for the traded assets;
   * read their `DynamicFees.AssetFee` at the event's block.
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
          [...ids].map(async (id) => {
            const fee = await this.api.query.DynamicFees.AssetFee.getValue(id, {
              at: block.hash,
            });
            this.dynamicFees.set(fee, id);
          })
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
        this.dynamicFeesConfig.clear();
      },
    };
  }

  // =============================================================================
  // Mutations
  // =============================================================================

  /**
   * Resolve the omnipool slice for the given assets, PINNED at `at` (the event's
   * block hash). Reads balance + `Omnipool.Assets` together so the implied price
   * can't tear. Returns a single mutation (one omnipool address).
   */
  private async omniAssetMutations(
    assetIds: number[],
    at: string
  ): Promise<PoolMutation<OmniPoolBase>[]> {
    const slices = await Promise.all(
      assetIds.map(async (id) => {
        const [bal, state] = await Promise.all([
          this.balance.getBalanceAt(this.poolAddress, id, at),
          this.api.query.Omnipool.Assets.getValue(id, { at }),
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
