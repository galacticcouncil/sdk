import {
  AccountId,
  Binary,
  CompatibilityLevel,
  Enum,
  FixedSizeArray,
} from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import {
  Subscription,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  merge,
} from 'rxjs';

import { PoolType, PoolLimits, PoolToken, PoolPair } from '../types';
import { PoolClient } from '../PoolClient';

import {
  HUB_ASSET_ID,
  HYDRATION_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  SYSTEM_ASSET_ID,
} from '../../consts';
import { fmt, QueryBus } from '../../utils';

import { OmniMath } from './OmniMath';
import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';
import {
  TAssetFeeParams,
  TDynamicFees,
  TDynamicFeesConfig,
  TEmaOracle,
  TOmnipoolAsset,
  TOmnipoolFeeRange,
  TProtocolFeeParams,
} from './types';

const { FeeUtils } = fmt;

const ORACLE_NAME = Binary.fromText('omnipool');
const ORACLE_PERIOD = Enum('Short');

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  private queryBus = new QueryBus(6000);

  private dynamicFees = this.queryBus.scope<number, TDynamicFees | undefined>(
    'DynamicFees.AssetFee',
    (id) => this.api.query.DynamicFees.AssetFee.getValue(id),
    (id) => String(id)
  );

  private dynamicFeesConfig = this.queryBus.scope<
    number,
    TDynamicFeesConfig | undefined
  >(
    'DynamicFees.AssetFeeConfiguration',
    (id) => this.api.query.DynamicFees.AssetFeeConfiguration.getValue(id),
    (id) => String(id)
  );

  private oracles = this.queryBus.scope<
    FixedSizeArray<2, number>,
    TEmaOracle | undefined
  >(
    'EmaOracle.Oracles.Short',
    (pair) =>
      this.api.query.EmaOracle.Oracles.getValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD
      ),
    (pair) => pair.join(':')
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

  private getOraclePair(asset: number): FixedSizeArray<2, number> {
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
    const query = this.api.query.Omnipool.Assets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
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
      this.api.query.Omnipool.Assets.getEntries(),
      this.api.query.Omnipool.HubAssetTradability.getValue(),
      this.api.query.AssetRegistry.Assets.getValue(hubAssetId),
      this.getBalance(poolAddress, hubAssetId),
      this.getPoolLimits(),
    ]);

    const poolTokens = entries.map(async ({ keyArgs, value }) => {
      const [id] = keyArgs;
      const { hub_reserve, shares, tradable, cap, protocol_shares } = value;

      const [meta, balance] = await Promise.all([
        this.api.query.AssetRegistry.Assets.getValue(id),
        this.getBalance(poolAddress, id),
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

    const feeConfiguration = await this.dynamicFeesConfig.get(feeAsset);
    if (feeConfiguration?.type === 'Fixed') {
      const { asset_fee, protocol_fee } = feeConfiguration.value;
      return {
        assetFee: FeeUtils.fromPermill(asset_fee),
        protocolFee: FeeUtils.fromPermill(protocol_fee),
      };
    }

    const oracleAfk = this.getOraclePair(feeAsset);
    const oraclePfk = this.getOraclePair(protocolAsset);

    const [dynamicFee, oracleAssetFee, oracleProtocolFee] = await Promise.all([
      this.dynamicFees.get(feeAsset),
      this.oracles.get(oracleAfk),
      this.oracles.get(oraclePfk),
    ]);

    const [assetFeeMin, assetFee, assetFeeMax] = await this.getAssetFee(
      pair,
      0, // fix
      dynamicFee,
      oracleAssetFee,
      feeConfiguration?.value.asset_fee_params
    );

    const [protocolFeeMin, protocolFee, protocolFeeMax] =
      protocolAsset === HUB_ASSET_ID
        ? [0, 0, 0] // No protocol fee for LRNA sell
        : await this.getProtocolFee(
            pair,
            0,
            dynamicFee,
            oracleProtocolFee,
            feeConfiguration?.value.protocol_fee_params
          );

    const min = assetFeeMin + protocolFeeMin;
    const max = assetFeeMax + protocolFeeMax;

    return {
      assetFee: FeeUtils.fromPermill(assetFee),
      protocolFee: FeeUtils.fromPermill(protocolFee),
      min: FeeUtils.fromPermill(min),
      max: FeeUtils.fromPermill(max),
    };
  }

  private async getAssetFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: TDynamicFees | undefined,
    oracle: TEmaOracle | undefined,
    configuration: TAssetFeeParams | undefined
  ): Promise<TOmnipoolFeeRange> {
    const { assetOut, balanceOut } = poolPair;

    const { min_fee, max_fee, decay, amplification } = configuration
      ? configuration
      : await this.api.constants.DynamicFees.AssetFeeParameters();

    if (!dynamicFee || !oracle) {
      return [min_fee, min_fee, max_fee];
    }

    const feeMin = FeeUtils.fromPermill(min_fee);
    const feeMax = FeeUtils.fromPermill(max_fee);

    const [entry] = oracle;
    const { asset_fee, timestamp } = dynamicFee;

    const blockDifference = Math.max(1, blockNumber - timestamp);

    let oracleAmountIn = entry.volume.b_in.toString();
    let oracleAmountOut = entry.volume.b_out.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetOut === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.a_in.toString();
      oracleAmountOut = entry.volume.a_out.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = FeeUtils.fromPermill(asset_fee);
    const fee = OmniMath.recalculateAssetFee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      '9',
      balanceOut.toString(),
      FeeUtils.toRaw(feePrev).toString(),
      blockDifference.toString(),
      FeeUtils.toRaw(feeMin).toString(),
      FeeUtils.toRaw(feeMax).toString(),
      decay.toString(),
      amplification.toString()
    );
    return [min_fee, Number(fee) * PERMILL_DENOMINATOR, max_fee];
  }

  private async getProtocolFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: TDynamicFees | undefined,
    oracle: TEmaOracle | undefined,
    configuration: TProtocolFeeParams | undefined
  ): Promise<TOmnipoolFeeRange> {
    const { assetIn, balanceIn } = poolPair;

    const { min_fee, max_fee, decay, amplification } = configuration
      ? configuration
      : await this.api.constants.DynamicFees.ProtocolFeeParameters();

    if (!dynamicFee || !oracle) {
      return [min_fee, min_fee, max_fee];
    }

    const feeMin = FeeUtils.fromPermill(min_fee);
    const feeMax = FeeUtils.fromPermill(max_fee);

    const [entry] = oracle;
    const { protocol_fee, timestamp } = dynamicFee;

    const blockDifference = Math.max(1, blockNumber - timestamp);

    let oracleAmountIn = entry.volume.b_in.toString();
    let oracleAmountOut = entry.volume.b_out.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetIn === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.a_in.toString();
      oracleAmountOut = entry.volume.a_out.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = FeeUtils.fromPermill(protocol_fee);
    const fee = OmniMath.recalculateProtocolFee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      '9',
      balanceIn.toString(),
      FeeUtils.toRaw(feePrev).toString(),
      blockDifference.toString(),
      FeeUtils.toRaw(feeMin).toString(),
      FeeUtils.toRaw(feeMax).toString(),
      decay.toString(),
      amplification.toString()
    );
    return [min_fee, Number(fee) * PERMILL_DENOMINATOR, max_fee];
  }

  private subscribeOracles(): Subscription {
    const [pool] = this.store.pools;

    const oraclePairs = pool.tokens
      .map((t) => t.id)
      .map((id) => this.getOraclePair(id));

    const streams = oraclePairs.map((pair) =>
      this.api.query.EmaOracle.Oracles.watchValue(
        ORACLE_NAME,
        pair,
        ORACLE_PERIOD,
        'best'
      ).pipe(
        filter((v): v is TEmaOracle => v !== undefined),
        map((value) => ({
          pair,
          value,
        }))
      )
    );

    return merge(streams)
      .pipe(finalize(() => this.oracles.clear()))
      .subscribe((deltas) => {
        deltas.forEach((delta) => {
          const { pair, value } = delta;
          this.oracles.set(pair, value);
        });
      });
  }

  private subscribeDynamicFees(): Subscription {
    return this.api.query.DynamicFees.AssetFee.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        finalize(() => this.dynamicFees.clear())
      )
      .subscribe(({ deltas }) => {
        deltas?.upserted.forEach((delta) => {
          const [key] = delta.args;
          this.dynamicFees.set(key, delta.value);
        });
      });
  }

  private subscribeDynamicFeesConfig(): Subscription {
    return this.api.query.DynamicFees.AssetFeeConfiguration.watchEntries({
      at: 'best',
    })
      .pipe(
        distinctUntilChanged((_, current) => !current.deltas),
        finalize(() => this.dynamicFeesConfig.clear())
      )
      .subscribe(({ deltas }) => {
        deltas?.upserted.forEach((delta) => {
          const [key] = delta.args;
          this.dynamicFeesConfig.set(key, delta.value);
        });
      });
  }

  private subscribeAssets(): Subscription {
    return this.api.query.Omnipool.Assets.watchEntries({
      at: 'best',
    })
      .pipe(distinctUntilChanged((_, current) => !current.deltas))
      .subscribe(({ deltas }) => {
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

    sub.add(this.subscribeAssets);
    sub.add(this.subscribeDynamicFees);
    sub.add(this.subscribeDynamicFeesConfig);
    sub.add(this.subscribeOracles);

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
