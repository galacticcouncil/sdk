import type {
  PalletEmaOracleOracleEntry,
  PalletDynamicFeesFeeEntry,
  PalletOmnipoolAssetState,
  PalletDynamicFeesFeeParams,
  PalletDynamicFeesAssetFeeConfig,
} from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { ITuple } from '@polkadot/types-codec/types';
import { Option, u32 } from '@polkadot/types-codec';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import {
  HUB_ASSET_ID,
  HYDRADX_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  SYSTEM_ASSET_ID,
} from '../../consts';
import { BigNumber, bnum } from '../../utils/bignumber';
import { FeeUtils } from '../../utils/fee';

import {
  PoolBase,
  PoolType,
  PoolToken,
  PoolLimits,
  PoolFees,
  PoolPair,
} from '../types';
import { PoolClient } from '../PoolClient';

import { OmniMath } from './OmniMath';
import { OmniPoolFees, OmniPoolToken } from './OmniPool';

type OmniPoolFeeRange = [number, number, number];

type TEmaOracle = Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>;
type TDynamicFees = Option<PalletDynamicFeesFeeEntry>;
type TDynamicFeesConfiguration = Option<PalletDynamicFeesAssetFeeConfig>;

const ORACLE_NAME = 'omnipool';
const ORACLE_PERIOD = 'Short';

export class OmniPoolClient extends PoolClient {
  private dynamicFees: Map<string, TDynamicFees> = new Map();
  private dynamicFeesConfiguration: Map<string, TDynamicFeesConfiguration> =
    new Map();
  private oracles: Map<string, TEmaOracle> = new Map();

  private memQueryCache = new TLRUCache<string, Promise<any>>(null, {
    ttl: 6 * 1000,
  });

  private memOracleQuery = memoize1((key: string) => {
    const oracleKey = key.split(':');
    return this.api.query.emaOracle.oracles<TEmaOracle>(
      ORACLE_NAME,
      oracleKey,
      ORACLE_PERIOD
    );
  }, this.memQueryCache);

  private memFeesQuery = memoize1((key: string) => {
    return this.api.query.dynamicFees.assetFee(key);
  }, this.memQueryCache);

  private memFeesConfigurationQuery = memoize1((key: string) => {
    return this.api.query.dynamicFees.assetFeeConfiguration(key);
  }, this.memQueryCache);

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  private getPoolId(): string {
    return encodeAddress(
      stringToU8a('modlomnipool'.padEnd(32, '\0')),
      HYDRADX_SS58_PREFIX
    );
  }

  private getOracleKey(asset: string): [string, string] {
    return asset === SYSTEM_ASSET_ID
      ? [SYSTEM_ASSET_ID, HUB_ASSET_ID]
      : [HUB_ASSET_ID, asset];
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.omnipool.maxInRatio.toNumber();
    const maxOutRatio = this.api.consts.omnipool.maxOutRatio.toNumber();
    const minTradingLimit =
      this.api.consts.omnipool.minimumTradingLimit.toNumber();
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }

  private async getDynamicFees(feeAsset: string): Promise<TDynamicFees> {
    if (this.dynamicFees.has(feeAsset)) {
      return this.dynamicFees.get(feeAsset)!;
    }
    return this.memFeesQuery(feeAsset);
  }

  private async getDynamicFeesConfiguration(
    feeAsset: string
  ): Promise<TDynamicFeesConfiguration> {
    if (this.dynamicFeesConfiguration.has(feeAsset)) {
      return this.dynamicFeesConfiguration.get(feeAsset)!;
    }
    return this.memFeesConfigurationQuery(feeAsset);
  }

  private async getOraclePrice(asset: string): Promise<TEmaOracle> {
    const oracleKey = this.getOracleKey(asset);
    const oracleCacheKey = oracleKey.join(':');
    if (this.oracles.has(oracleCacheKey)) {
      return this.oracles.get(oracleCacheKey)!;
    }
    return this.memOracleQuery(oracleCacheKey);
  }

  isSupported(): boolean {
    return this.api.query.omnipool !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAddress = this.getPoolId();

    const [assets, hubAssetTradeability, hubAssetBalance] = await Promise.all([
      this.api.query.omnipool.assets.entries(),
      this.api.query.omnipool.hubAssetTradability(),
      this.getBalance(poolAddress, hubAssetId),
    ]);

    const poolTokens = assets.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const {
          hubReserve,
          shares,
          tradable,
          cap,
          protocolShares,
        }: PalletOmnipoolAssetState = state.unwrap();
        const balance = await this.getBalance(poolAddress, id.toString());
        return {
          id: id.toString(),
          hubReserves: bnum(hubReserve.toString()),
          shares: bnum(shares.toString()),
          tradeable: tradable.bits.toNumber(),
          balance: balance.toString(),
          cap: bnum(cap.toString()),
          protocolShares: bnum(protocolShares.toString()),
        } as OmniPoolToken;
      }
    );

    const tokens = await Promise.all(poolTokens);

    // add LRNA
    tokens.push({
      id: hubAssetId,
      tradeable: hubAssetTradeability.bits.toNumber(),
      balance: hubAssetBalance.toString(),
    } as OmniPoolToken);

    return [
      {
        address: poolAddress,
        type: PoolType.Omni,
        hubAssetId: hubAssetId,
        tokens: tokens,
        ...this.getPoolLimits(),
      } as PoolBase,
    ];
  }

  async getPoolFees(
    block: number,
    poolPair: PoolPair,
    _poolAddress: string
  ): Promise<OmniPoolFees> {
    const feeAsset = poolPair.assetOut;
    const protocolAsset = poolPair.assetIn;

    const feeConfiguration = await this.getDynamicFeesConfiguration(
      feeAsset
    ).then((configuration) => configuration.unwrapOr(null));

    if (feeConfiguration?.isFixed) {
      const assetFee = feeConfiguration.asFixed.assetFee.toNumber();
      const protocolFee = feeConfiguration.asFixed.protocolFee.toNumber();

      return {
        assetFee: FeeUtils.fromPermill(assetFee),
        protocolFee: FeeUtils.fromPermill(protocolFee),
      };
    }

    const [dynamicFees, oracleAssetFee, oracleProtocolFee] = await Promise.all([
      this.getDynamicFees(feeAsset),
      this.getOraclePrice(feeAsset),
      this.getOraclePrice(protocolAsset),
    ]);

    const [assetFeeMin, assetFee, assetFeeMax] = this.getAssetFee(
      poolPair,
      block,
      dynamicFees,
      oracleAssetFee,
      feeConfiguration?.isDynamic
        ? feeConfiguration.asDynamic.assetFeeParams
        : undefined
    );

    const [protocolFeeMin, protocolFee, protocolFeeMax] =
      protocolAsset === HUB_ASSET_ID
        ? [0, 0, 0] // No protocol fee for LRNA sell
        : this.getProtocolFee(
            poolPair,
            block,
            dynamicFees,
            oracleProtocolFee,
            feeConfiguration?.isDynamic
              ? feeConfiguration.asDynamic.protocolFeeParams
              : undefined
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

  private getAssetFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: Option<PalletDynamicFeesFeeEntry>,
    oracle: Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>,
    configuration?: PalletDynamicFeesFeeParams
  ): OmniPoolFeeRange {
    const { assetOut, balanceOut } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      configuration || this.api.consts.dynamicFees.assetFeeParameters;

    const feeMin = FeeUtils.fromPermill(minFee.toNumber());
    const feeMax = FeeUtils.fromPermill(maxFee.toNumber());

    if (dynamicFee.isNone || oracle.isNone) {
      return [minFee.toNumber(), minFee.toNumber(), maxFee.toNumber()];
    }

    const [entry] = oracle.unwrap();
    const { assetFee, timestamp } = dynamicFee.unwrap();

    const blockDifference = Math.max(1, blockNumber - timestamp.toNumber());

    let oracleAmountIn = entry.volume.bIn.toString();
    let oracleAmountOut = entry.volume.bOut.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetOut === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.aIn.toString();
      oracleAmountOut = entry.volume.aOut.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = FeeUtils.fromPermill(assetFee.toNumber());
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
    return [
      minFee.toNumber(),
      Number(fee) * PERMILL_DENOMINATOR,
      maxFee.toNumber(),
    ];
  }

  private getProtocolFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: Option<PalletDynamicFeesFeeEntry>,
    oracle: Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>,
    configuration?: PalletDynamicFeesFeeParams
  ): OmniPoolFeeRange {
    const { assetIn, balanceIn } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      configuration || this.api.consts.dynamicFees.protocolFeeParameters;

    const feeMin = FeeUtils.fromPermill(minFee.toNumber());
    const feeMax = FeeUtils.fromPermill(maxFee.toNumber());

    if (dynamicFee.isNone || oracle.isNone) {
      return [minFee.toNumber(), minFee.toNumber(), maxFee.toNumber()];
    }

    const [entry] = oracle.unwrap();
    const { protocolFee, timestamp } = dynamicFee.unwrap();

    const blockDifference = Math.max(1, blockNumber - timestamp.toNumber());

    let oracleAmountIn = entry.volume.bIn.toString();
    let oracleAmountOut = entry.volume.bOut.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetIn === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.aIn.toString();
      oracleAmountOut = entry.volume.aOut.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = FeeUtils.fromPermill(protocolFee.toNumber());
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
    return [
      minFee.toNumber(),
      Number(fee) * PERMILL_DENOMINATOR,
      maxFee.toNumber(),
    ];
  }

  protected async subscribeUpdates(): UnsubscribePromise {
    const [pool] = this.pools;

    const assetsArgs = pool.tokens.map((t) => t.id);
    const unsubFns: (() => void)[] = [];

    const unsubAssets = await this.api.query.omnipool.assets.multi(
      assetsArgs,
      (states) => {
        pool.tokens = states.map((state, i) => {
          const token = pool.tokens[i];
          if (state.isNone) return token;
          const unwrapped: PalletOmnipoolAssetState = state.unwrap();
          return this.updateTokenState(token, unwrapped);
        });
      }
    );
    unsubFns.push(unsubAssets);

    const unsubAssetsFees = await this.api.query.dynamicFees.assetFee.multi(
      assetsArgs,
      (fees) => {
        fees.forEach((fee, i) => {
          const key = assetsArgs[i];
          this.dynamicFees.set(key, fee);
        });
      }
    );
    unsubFns.push(unsubAssetsFees);

    const unsubAssetsFeeConfigurations =
      await this.api.query.dynamicFees.assetFeeConfiguration.multi(
        assetsArgs,
        (configs) => {
          configs.forEach((config, i) => {
            const key = assetsArgs[i];
            this.dynamicFeesConfiguration.set(key, config);
          });
        }
      );
    unsubFns.push(unsubAssetsFeeConfigurations);

    const oracleQueries = assetsArgs.map((id) => {
      const pair = this.getOracleKey(id);
      return [ORACLE_NAME, pair, ORACLE_PERIOD] as [
        string,
        [string, string],
        string,
      ];
    });

    const unsubOracles = await this.api.query.emaOracle.oracles.multi(
      oracleQueries,
      (oracles) => {
        oracles.forEach(async (oracle, i) => {
          const key = oracleQueries[i];
          const [_name, pair, _period] = key;
          this.oracles.set(pair.join(':'), oracle);
        });
      }
    );
    unsubFns.push(unsubOracles);

    return () => {
      for (const unsub of unsubFns) {
        try {
          unsub();
        } catch (e) {
          console.warn('Omnipool unsubscribe failed', e);
        }
      }
    };
  }

  private updateTokenState(
    token: PoolToken,
    tokenState: PalletOmnipoolAssetState
  ) {
    const { hubReserve, shares, tradable, cap, protocolShares } = tokenState;
    return {
      ...token,
      hubReserves: bnum(hubReserve.toString()),
      shares: bnum(shares.toString()),
      cap: bnum(cap.toString()),
      protocolShares: bnum(protocolShares.toString()),
      tradeable: tradable.bits.toNumber(),
    } as OmniPoolToken;
  }
}
