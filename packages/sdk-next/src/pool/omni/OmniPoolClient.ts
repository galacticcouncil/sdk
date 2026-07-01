import {
  AccountId,
  Binary,
  CompatibilityLevel,
  Enum,
  SizedHex,
} from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import {
  Subscription,
  distinctUntilChanged,
  finalize,
  map,
  tap,
} from 'rxjs';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { PoolClient } from '../PoolClient';
import { PoolType, PoolLimits, PoolToken, PoolPair } from '../types';

import { fmt, QueryBus } from '../../utils';

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

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  private queryBus = new QueryBus();
  private block: number = 0;

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
    const wanted = new Set(
      pool.tokens.map((t) => getEmaPair(t.id).join(':'))
    );

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

  private subscribeAssets(): Subscription {
    return this.api.query.Omnipool.Assets.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        map((value, index) => ({ value, index })),
        tap(({ value, index }) => {
          if (index > 0) {
            this.log.trace('omnipool.Assets', value.deltas?.upserted);
          }
        }),
        this.watchGuard('omnipool.Assets')
      )
      .subscribe(({ value: { deltas } }) => {
        this.store.update(([pool]) => {
          const changes = deltas?.upserted.reduce((acc, o) => {
            const [key] = o.args;
            acc.set(key, o.value);
            return acc;
          }, new Map<number, TOmnipoolAsset>());

          const updated = pool.tokens.map((t) => {
            const delta = changes?.get(t.id);
            return delta ? this.updateTokenState(t, delta) : t;
          });

          return [
            {
              ...pool,
              tokens: updated,
            },
          ];
        });
      });
  }

  protected subscribeUpdates(): Subscription {
    const sub = new Subscription();

    sub.add(this.subscribeAssets());
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
