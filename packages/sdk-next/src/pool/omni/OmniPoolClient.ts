import {
  AccountId,
  Binary,
  CompatibilityLevel,
  Enum,
  FixedSizeArray,
} from 'polkadot-api';
import { toHex } from '@polkadot-api/utils';

import { HydrationQueries } from '@galacticcouncil/descriptors';

import { memoize1 } from '@thi.ng/memoize';
import { TLRUCache } from '@thi.ng/cache';

import { type Observable, distinctUntilChanged, map } from 'rxjs';

import { PoolType, PoolLimits, PoolFees, PoolToken } from '../types';
import { PoolClient } from '../PoolClient';

import {
  HUB_ASSET_ID,
  HYDRATION_SS58_PREFIX,
  SYSTEM_ASSET_ID,
} from '../../consts';
import { fmt, json } from '../../utils';

import { OmniPoolBase, OmniPoolFees, OmniPoolToken } from './OmniPool';

const { FeeUtils } = fmt;

type TDynamicFees = HydrationQueries['DynamicFees']['AssetFee']['Value'];
type TDynamicFeesConfiguration =
  HydrationQueries['DynamicFees']['AssetFeeConfiguration']['Value'];
type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];
type TOmnipoolAsset = HydrationQueries['Omnipool']['Assets']['Value'];

const ORACLE_NAME = Binary.fromText('omnipool');
const ORACLE_PERIOD = Enum('Short');

export class OmniPoolClient extends PoolClient<OmniPoolBase> {
  private dynamicFees: Map<number, TDynamicFees> = new Map();
  private dynamicFeesConfiguration: Map<number, TDynamicFeesConfiguration> =
    new Map();
  private oracles: Map<string, TEmaOracle> = new Map();

  private memQueryCache = new TLRUCache<number | string, Promise<any>>(null, {
    ttl: 6 * 1000,
  });

  private memOracleQuery = memoize1((key: string) => {
    return this.api.query.EmaOracle.Oracles.getValue(
      ORACLE_NAME,
      this.getOracleKey(key),
      ORACLE_PERIOD
    );
  }, this.memQueryCache);

  private memFeesQuery = memoize1((key: number) => {
    return this.api.query.DynamicFees.AssetFee.getValue(key);
  }, this.memQueryCache);

  private memFeesConfigurationQuery = memoize1((key: number) => {
    return this.api.query.DynamicFees.AssetFeeConfiguration.getValue(key);
  }, this.memQueryCache);

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  private getPoolAddress() {
    const name = 'modlomnipool'.padEnd(32, '\0');
    const nameU8a = new TextEncoder().encode(name);
    const nameHex = toHex(nameU8a);
    return AccountId(HYDRATION_SS58_PREFIX).dec(nameHex);
  }

  private getOracleKey(asset: number | string): FixedSizeArray<2, number> {
    // Check for composite key
    if (typeof asset === 'string') {
      return asset.split(':').map((k) => Number(k)) as FixedSizeArray<
        2,
        number
      >;
    }

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

  private async getDynamicFees(feeAsset: number): Promise<TDynamicFees> {
    if (this.dynamicFees.has(feeAsset)) {
      return this.dynamicFees.get(feeAsset)!;
    }
    return this.memFeesQuery(feeAsset);
  }

  private async getDynamicFeesConfiguration(
    feeAsset: number
  ): Promise<TDynamicFeesConfiguration> {
    if (this.dynamicFeesConfiguration.has(feeAsset)) {
      return this.dynamicFeesConfiguration.get(feeAsset)!;
    }
    return this.memFeesConfigurationQuery(feeAsset);
  }

  private async getOraclePrice(asset: number): Promise<TEmaOracle> {
    const oracleKey = this.getOracleKey(asset);
    const oracleCacheKey = oracleKey.join(':');
    if (this.oracles.has(oracleCacheKey)) {
      return this.oracles.get(oracleCacheKey)!;
    }
    return this.memOracleQuery(oracleCacheKey);
  }

  async isSupported(): Promise<boolean> {
    const query = this.api.query.Omnipool.Assets;
    const compatibilityToken = await this.api.compatibilityToken;
    return query.isCompatible(
      CompatibilityLevel.BackwardsCompatible,
      compatibilityToken
    );
  }

  async isAssetConfigSupported(): Promise<boolean> {
    const query = this.api.query.DynamicFees.AssetFeeConfiguration;
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

  async getPoolFees(_pool: OmniPoolBase, feeAsset: number): Promise<PoolFees> {
    const [afp, pfp, dynamicFees] = await Promise.all([
      this.api.constants.DynamicFees.AssetFeeParameters(),
      this.api.constants.DynamicFees.ProtocolFeeParameters(),
      this.api.query.DynamicFees.AssetFee.getValue(feeAsset),
    ]);

    const min = afp.min_fee + pfp.min_fee;
    const max = afp.max_fee + pfp.max_fee;

    if (dynamicFees) {
      const { asset_fee, protocol_fee } = dynamicFees;
      return {
        assetFee: FeeUtils.fromPermill(asset_fee),
        protocolFee: FeeUtils.fromPermill(protocol_fee),
        min: FeeUtils.fromPermill(min),
        max: FeeUtils.fromPermill(max),
      } as OmniPoolFees;
    } else {
      return {
        assetFee: FeeUtils.fromPermill(afp.min_fee),
        protocolFee: FeeUtils.fromPermill(pfp.min_fee),
        min: FeeUtils.fromPermill(min),
        max: FeeUtils.fromPermill(max),
      } as OmniPoolFees;
    }
  }

  protected subscribeUpdates(
    initial: OmniPoolBase[]
  ): Observable<OmniPoolBase[]> {
    const [pool] = initial;

    const observer = this.api.query.Omnipool.Assets.watchEntries({
      at: 'best',
    }).pipe(
      distinctUntilChanged((_, current) => !current.deltas),
      map(({ entries }) => {
        return entries.map((e) => {
          const [key] = e.args;
          const tokenIndex = pool.tokens.findIndex((t) => t.id === key);
          const token = pool.tokens[tokenIndex];
          return this.updateTokenState(token, e.value);
        });
      }),
      map((tokens) => {
        const lrna = pool.tokens.find((t) => t.id === HUB_ASSET_ID);
        return {
          ...pool,
          tokens: [...tokens, lrna],
        } as OmniPoolBase;
      })
    );

    return observer.pipe(map((p) => [p]));
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
