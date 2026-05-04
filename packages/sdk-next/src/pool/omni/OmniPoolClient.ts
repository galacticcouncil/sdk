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
  filter,
  finalize,
  map,
  merge,
  tap,
} from 'rxjs';

import { HYDRATION_SS58_PREFIX } from '@galacticcouncil/common';

import { PoolClient } from '../PoolClient';
import { PoolType, PoolLimits, PoolToken, PoolPair } from '../types';

import { HUB_ASSET_ID, SYSTEM_ASSET_ID } from '../../consts';
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
        at: 'best',
      }),
    (id) => String(id)
  );

  private dynamicFees = this.queryBus.scope<[number], TDynamicFees | undefined>(
    'DynamicFees.AssetFee',
    (id) => this.api.query.DynamicFees.AssetFee.getValue(id, { at: 'best' }),
    (id) => String(id),
    6 * 1000
  );

  private maxSlipFee = this.queryBus.scope<[], TSlipFee | undefined>(
    'Omnipool.SlipFee',
    () => this.apiNext.query.Omnipool.SlipFee.getValue({ at: 'best' }),
    () => String('slipFee')
  );

  private emaOracles = this.queryBus.scope<[TEmaPair], TEmaOracle | undefined>(
    'EmaOracle.Oracles.Short',
    (pair) =>
      this.api.query.EmaOracle.Oracles.getValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD,
        { at: 'best' }
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

  private getOraclePair(asset: number): TEmaPair {
    return asset === SYSTEM_ASSET_ID
      ? [SYSTEM_ASSET_ID, HUB_ASSET_ID]
      : [HUB_ASSET_ID, asset];
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

  async isSlipFeeSupported(): Promise<boolean> {
    const staticApis = await this.apiNext.getStaticApis();
    return staticApis.compat.query.Omnipool.SlipFee.isCompatible(
      CompatibilityLevel.Partial
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
    ] = await Promise.all([
      this.api.query.Omnipool.Assets.getEntries({ at: 'best' }),
      this.api.query.Omnipool.HubAssetTradability.getValue(),
      this.api.query.AssetRegistry.Assets.getValue(hubAssetId),
      this.balance.getBalance(poolAddress, hubAssetId),
      this.getPoolLimits(),
    ]);

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;

      const [meta, balance] = await Promise.all([
        this.api.query.AssetRegistry.Assets.getValue(id),
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

    let maxSlipFee = 0;

    const isSlipFeeSupported = await this.isSlipFeeSupported();
    if (isSlipFeeSupported) {
      const slipFee = await this.maxSlipFee.get();
      maxSlipFee = slipFee ?? 0;
    }

    const feeConfiguration = await this.dynamicFeesConfig.get(feeAsset);
    if (feeConfiguration?.type === 'Fixed') {
      const { asset_fee, protocol_fee } = feeConfiguration.value;
      return {
        assetFee: FeeUtils.fromPermill(asset_fee),
        protocolFee: FeeUtils.fromPermill(protocol_fee),
        maxSlipFee: FeeUtils.fromPermill(maxSlipFee),
      };
    }

    const oracleAfk = this.getOraclePair(feeAsset);
    const oraclePfk = this.getOraclePair(protocolAsset);

    const [dynamicFee, oracleAssetFee, oracleProtocolFee] = await Promise.all([
      this.dynamicFees.get(feeAsset),
      this.emaOracles.get(oracleAfk),
      this.emaOracles.get(oraclePfk),
    ]);

    const assetParams =
      feeConfiguration?.value.asset_fee_params ??
      (await this.api.constants.DynamicFees.AssetFeeParameters());

    const [assetFeeMin, assetFee, assetFeeMax] = OmniPoolFee.getAssetFee({
      pair,
      block: this.block,
      dynamicFee,
      oracle: oracleAssetFee,
      params: assetParams,
    });

    let protocolFeeMin = 0;
    let protocolFee = 0;
    let protocolFeeMax = 0;
    if (protocolAsset !== HUB_ASSET_ID) {
      const protocolParams =
        feeConfiguration?.value.protocol_fee_params ??
        (await this.api.constants.DynamicFees.ProtocolFeeParameters());

      [protocolFeeMin, protocolFee, protocolFeeMax] = OmniPoolFee.getProtocolFee({
        pair,
        block: this.block,
        dynamicFee,
        oracle: oracleProtocolFee,
        params: protocolParams,
      });
    }

    const min = assetFeeMin + protocolFeeMin;
    const max = assetFeeMax + protocolFeeMax;

    return {
      assetFee: FeeUtils.fromPermill(assetFee),
      protocolFee: FeeUtils.fromPermill(protocolFee),
      maxSlipFee: FeeUtils.fromPermill(maxSlipFee),
      min: FeeUtils.fromPermill(min),
      max: FeeUtils.fromPermill(max),
    };
  }

  private subscribeEmaOracles(): Subscription {
    const [pool] = this.store.pools;

    const oraclePairs = pool.tokens
      .map((t) => t.id)
      .map((id) => this.getOraclePair(id));

    const streams = oraclePairs.map((pair) =>
      this.api.query.EmaOracle.Oracles.watchValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD,
        { at: 'best' }
      ).pipe(
        map(({ value }) => value),
        filter((v): v is TEmaOracle => v !== undefined),
        map((value, index) => ({ value, index })),
        tap(({ index }) => {
          if (index > 0) {
            this.log.trace('emaOracle.Oracles', pair.join(':'));
          }
        }),
        map(({ value }) => ({
          pair,
          value,
        }))
      )
    );

    return merge(...streams)
      .pipe(
        finalize(() => this.emaOracles.clear()),
        this.watchGuard('emaOracle.Oracles')
      )
      .subscribe((delta) => {
        const { pair, value } = delta;
        this.emaOracles.set(value, pair);
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
