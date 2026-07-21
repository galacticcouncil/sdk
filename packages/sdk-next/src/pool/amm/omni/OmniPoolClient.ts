import {
  AccountId,
  Binary,
  CompatibilityLevel,
  Enum,
  SizedHex,
} from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { Subscription, distinctUntilChanged, finalize, map, tap } from 'rxjs';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { PoolClient } from '../../PoolClient';
import { PoolType, PoolLimits, PoolToken, PoolPair } from '../../types';
import { PoolEventHandler, PoolMutation } from '../../events';

import { fmt, QueryBus } from '../../../utils';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';
import { OmniPoolFee } from './OmniPoolFee';
import {
  TDynamicFees,
  TDynamicFeesConfig,
  TEmaOracle,
  TEmaPair,
  TOmnipoolAsset,
  TSlipFee,
} from './types';
import { getEmaPair } from './utils';

const { FeeUtils } = fmt;

const ORACLE_NAME = Binary.toHex(Binary.fromText('omnipool')) as SizedHex<8>;
const ORACLE_PERIOD = Enum('Short');

// Omnipool events that move an asset's reserves and/or state — recompute that
// asset's slice (balance + Omnipool.Assets) pinned at the event's block.
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
  private block: number = 0;
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

  private subscribeEmaOracles(): Subscription {
    const [pool] = this.store.pools;

    // the omnipool oracle pairs we actually care about, keyed for O(1) lookup
    const wanted = new Set(pool.tokens.map((t) => getEmaPair(t.id).join(':')));

    // one merkle-gated subscription prefix-scoped to ORACLE_NAME instead of
    // one watchValue per pair (~23 `value` storage reads/block -> ~1 merkle
    // probe/block, with descendant reads only when an omnipool oracle changes).
    return this.api.query.EmaOracle.Oracles.watchEntries(ORACLE_NAME, {
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace('emaOracle.Oracles', value.deltas?.upserted);
          }
        }),
        finalize(() => this.emaOracles.clear()),
        this.watchGuard('emaOracle.Oracles')
      )
      .subscribe(({ value: { deltas } }) => {
        deltas?.upserted.forEach((delta) => {
          const [, pair, period] = delta.args;
          if (period.type !== ORACLE_PERIOD.type) return;
          if (!wanted.has(pair.join(':'))) return;
          this.emaOracles.set(delta.value, pair);
        });
      });
  }

  private subscribeDynamicFees(): Subscription {
    return this.api.query.DynamicFees.AssetFee.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace('dynamicFees.AssetFee', value.deltas?.upserted);
          }
        }),
        finalize(() => this.dynamicFees.clear()),
        this.watchGuard('dynamicFees.AssetFee')
      )
      .subscribe(({ value: { deltas } }) => {
        deltas?.upserted.forEach((delta) => {
          const [key] = delta.args;
          this.dynamicFees.set(delta.value, key);
        });
      });
  }

  private subscribeDynamicFeesConfig(): Subscription {
    return this.api.query.DynamicFees.AssetFeeConfiguration.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace(
              'dynamicFees.AssetFeeConfiguration',
              value.deltas?.upserted
            );
          }
        }),
        finalize(() => this.dynamicFeesConfig.clear()),
        this.watchGuard('dynamicFees.AssetFeeConfiguration')
      )
      .subscribe(({ value: { deltas } }) => {
        deltas?.upserted.forEach((delta) => {
          const [key] = delta.args;
          this.dynamicFeesConfig.set(delta.value, key);
        });
      });
  }

  private subscribeBlock(): Subscription {
    return this.watcher.bestBlock$
      .pipe(this.watchGuard('watcher.bestBlock'))
      .subscribe((block) => {
        this.block = block;
      });
  }

  protected syncHandlers(): PoolEventHandler<OmniPoolBase>[] {
    return [
      this.syncTradeHandler(),
      this.syncAssetHandler(),
      this.syncStructuralHandler(),
      this.syncSlipFeeHandler(),
    ];
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

  /**
   * Composition change (token added/removed) — full reseed (cheap, rare, v1).
   */
  private syncStructuralHandler(): PoolEventHandler<OmniPoolBase> {
    return {
      match: (e) => e.pallet === 'Omnipool' && STRUCTURAL_EVENTS.has(e.method),
      resolve: async () => {
        this.requestResync();
        return [];
      },
    };
  }

  /**
   * Slip fee — refresh the fee-input cache only, no store write.
   */
  private syncSlipFeeHandler(): PoolEventHandler<OmniPoolBase> {
    return {
      match: (e) => e.pallet === 'Omnipool' && e.method === 'SlipFeeSet',
      resolve: async (e) => {
        this.maxSlipFee.set(e.data.slip_fee);
        return [];
      },
    };
  }

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

  protected subscribeOracles(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribeDynamicFees());
    sub.add(this.subscribeDynamicFeesConfig());
    sub.add(this.subscribeEmaOracles());
    sub.add(this.subscribeBlock());

    return sub;
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
