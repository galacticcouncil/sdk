import {
  EmaOraclePeriod,
  EmaOracleSource,
  IOfflinePoolServiceDataSource,
  IPersistentDataInput,
  IPersistentEmaOracleEntry,
  IPersistentEmaOracleEntryData,
  IPersistentExtras,
  IPersistentLbpPoolBase,
  IPersistentMetaData,
  IPersistentMmOracleEntry,
  IPersistentOmniPoolBase,
  IPersistentOmnipoolExtras,
  IPersistentOmniPoolToken,
  IPersistentPoolBase,
  IPersistentPoolToken,
  IPersistentStableSwapBase,
  PersistentAsset,
} from '../types';
import { PoolBase, PoolFee, PoolToken, PoolType } from '../../types';
import { AssetType as RuntimeAssetType } from '../../../types';
import { StableMath, StableSwapBase } from '../../stable';
import { OmniPoolBase, OmniPoolToken } from '../../omni';
import { LbpPoolBase, WeightedPoolToken, LbpMath } from '../../lbp';
import { StableSwapOfflineUtils } from './StableSwapOfflineUtils';
import { fmt } from '../../../utils';

const { FeeUtils } = fmt;

// 100 * 10^6 — equivalent to scale(bnum(100), 6) in sdk
const MAX_FINAL_WEIGHT = 100_000_000n;

export class OfflinePoolUtils {
  static fromPersistentDataToDataSource(
    persistentData: IPersistentDataInput
  ): IOfflinePoolServiceDataSource {
    if (!persistentData.assets || persistentData.assets.length == 0)
      throw new Error('Assets list can not be empty');

    if (!persistentData.constants)
      throw new Error('Constants must be provided');
    if (!persistentData.meta)
      throw new Error('Datasource metadata must be provided');
    if (!persistentData.emaOracle)
      throw new Error('EmaOracle data must be provided');

    return {
      assets: OfflinePoolUtils.decorateAssetsPersistentData(
        persistentData.assets
      ),
      pools: {
        lbp: (persistentData.pools.lbp || []).map(
          OfflinePoolUtils.decorateLbpPoolPersistentData
        ),
        xyk: (persistentData.pools.xyk || []).map(
          OfflinePoolUtils.decorateBasePoolPersistentData
        ),
        stableswap: (persistentData.pools.stableswap || []).map((pool) =>
          OfflinePoolUtils.decorateStableswapPersistentData({
            src: pool,
            assets: persistentData.assets,
            emaOraclesData: persistentData.emaOracle,
            mmOraclesData: persistentData.mmOracle,
            metaData: persistentData.meta,
          })
        ),
        omnipool: (persistentData.pools.omnipool || []).map(
          OfflinePoolUtils.decorateOmniPoolPersistentData
        ),
        aave: (persistentData.pools.aave || []).map(
          OfflinePoolUtils.decorateBasePoolPersistentData
        ),
      },
      extras: OfflinePoolUtils.decorateExtrasPersistentData(persistentData),
      constants: persistentData.constants,
      emaOracle: persistentData.emaOracle,
      mmOracle: persistentData.mmOracle,
      meta: persistentData.meta,
    };
  }

  static decorateExtrasPersistentData(
    src: IPersistentDataInput
  ): IPersistentExtras {
    const omnipool = src.pools.omnipool[0];

    const omnipoolExtras: IPersistentOmnipoolExtras = {
      maxSlipFee: omnipool ? omnipool.maxSlipFee : 0,
    };
    return {
      omnipool: omnipoolExtras,
    };
  }

  static decorateEmaOraclesPersistentData(
    src: Array<IPersistentEmaOracleEntry>
  ): Map<
    EmaOracleSource,
    Map<EmaOraclePeriod, Map<string, IPersistentEmaOracleEntryData>>
  > {
    const emaOracleEntries = new Map();

    for (const oracleEntry of src) {
      if (!emaOracleEntries.has(oracleEntry.source)) {
        emaOracleEntries.set(oracleEntry.source, new Map());
      }
      if (!emaOracleEntries.get(oracleEntry.source)!.has(oracleEntry.period)) {
        emaOracleEntries
          .get(oracleEntry.source)!
          .set(oracleEntry.period, new Map());
      }

      emaOracleEntries
        .get(oracleEntry.source)!
        .get(oracleEntry.period)!
        .set(oracleEntry.assets.join('-'), oracleEntry.entry);
    }

    return emaOracleEntries;
  }

  protected static decoratePoolType(src: string): PoolType {
    if (!src) throw new Error('Pool type can not be empty');

    switch (src) {
      case 'aave':
      case 'Aave':
      case 'AAVE':
        return PoolType.Aave;
      case 'xyk':
      case 'Xyk':
      case 'XYK':
        return PoolType.XYK;
      case 'lbp':
      case 'Lbp':
      case 'LBP':
        return PoolType.LBP;
      case 'stable':
      case 'Stable':
      case 'STABLE':
      case 'Stableswap':
        return PoolType.Stable;
      case 'omni':
      case 'Omni':
      case 'OMNI':
      case 'Omnipool':
        return PoolType.Omni;
      default:
        throw new Error(`Unknown pool type: ${src}`);
    }
  }

  protected static decorateAssetsPersistentData(
    src: PersistentAsset[] = []
  ): PersistentAsset[] {
    return src.map((pAsset) => {
      const {
        id,
        decimals,
        existentialDeposit,
        type,
        isSufficient,
        symbol,
        name,
        icon,
        location,
        dynamicFee,
      } = pAsset;

      return {
        id,
        decimals,
        existentialDeposit,
        type,
        isSufficient,
        location,
        dynamicFee,
        symbol: symbol ?? '',
        name: name ?? '',
        icon: icon ?? '',
      } as PersistentAsset;
    });
  }

  static decorateBasePoolToken(src: IPersistentPoolToken): PoolToken {
    if (!src) throw new Error('Pool token can not be empty');

    const {
      id,
      decimals,
      balance,
      tradeable,
      tradable,
      existentialDeposit,
      type,
    } = src;

    return {
      id: Number(id),
      decimals,
      balance: BigInt(balance),
      tradeable: tradeable ?? tradable,
      existentialDeposit: BigInt(existentialDeposit),
      type: type as unknown as RuntimeAssetType,
    };
  }

  protected static decorateOmniPoolToken(
    src: IPersistentOmniPoolToken
  ): OmniPoolToken {
    if (!src) throw new Error('Pool token can not be empty');

    const {
      id,
      decimals,
      balance,
      tradable,
      hubReserves,
      shares,
      cap,
      protocolShares,
      existentialDeposit,
      type,
    } = src;

    return {
      tradeable: tradable,
      hubReserves: BigInt(hubReserves),
      shares: BigInt(shares),
      cap: BigInt(cap),
      protocolShares: BigInt(protocolShares),
      id: Number(id),
      decimals,
      balance: BigInt(balance),
      existentialDeposit: BigInt(existentialDeposit),
      type: type as unknown as RuntimeAssetType,
    };
  }

  protected static decorateBasePoolPersistentData(
    src: IPersistentPoolBase
  ): PoolBase {
    if (!src) throw new Error('Pool can not be empty');

    const {
      address,
      id,
      type,
      tokens,
      maxInRatio,
      maxOutRatio,
      minTradingLimit,
    } = src;

    return {
      id: id != null ? Number(id) : undefined,
      address,
      type: OfflinePoolUtils.decoratePoolType(type as unknown as string),
      tokens: tokens.map(OfflinePoolUtils.decorateBasePoolToken),
      maxInRatio: BigInt(maxInRatio),
      maxOutRatio: BigInt(maxOutRatio),
      minTradingLimit: BigInt(minTradingLimit),
    };
  }

  protected static decorateLbpPoolPersistentData(
    src: IPersistentLbpPoolBase
  ): LbpPoolBase {
    if (!src) throw new Error('Pool can not be empty');

    const basePoolData = OfflinePoolUtils.decorateBasePoolPersistentData(src);

    const {
      start,
      end,
      tokens,
      initialWeight,
      finalWeight,
      relayBlockNumber,
    } = src;

    const lbpPoolData: LbpPoolBase = {
      ...basePoolData,
      fee: src.fee as PoolFee,
      repayFeeApply: src.repayFeeApply,
    };

    const linearWeight = LbpMath.calculateLinearWeights(
      start.toString(),
      end.toString(),
      initialWeight.toString(),
      finalWeight.toString(),
      relayBlockNumber.toString()
    );

    const [accumulated, distributed] = tokens;
    const accumulatedWeight = BigInt(linearWeight);
    const distributedWeight = MAX_FINAL_WEIGHT - accumulatedWeight;

    lbpPoolData.tokens = [
      {
        id: Number(accumulated.id),
        weight: accumulatedWeight,
        balance: BigInt(accumulated.balance),
        existentialDeposit: BigInt(accumulated.existentialDeposit),
        type: accumulated.type,
        isSufficient: accumulated.isSufficient,
      } as WeightedPoolToken,
      {
        id: Number(distributed.id),
        weight: distributedWeight,
        balance: BigInt(distributed.balance),
        existentialDeposit: BigInt(distributed.existentialDeposit),
        type: distributed.type,
        isSufficient: distributed.isSufficient,
      } as WeightedPoolToken,
    ];

    return lbpPoolData;
  }

  protected static decorateStableswapPersistentData({
    src,
    assets,
    emaOraclesData,
    mmOraclesData,
    metaData,
  }: {
    src: IPersistentStableSwapBase;
    assets: Array<PersistentAsset>;
    emaOraclesData: IPersistentEmaOracleEntry[];
    mmOraclesData: IPersistentMmOracleEntry[];
    metaData: IPersistentMetaData;
  }): StableSwapBase {
    if (!src) throw new Error('Pool can not be empty');

    const { address, type, tokens, maxInRatio, maxOutRatio, minTradingLimit } =
      OfflinePoolUtils.decorateBasePoolPersistentData(src);

    const {
      initialAmplification,
      finalAmplification,
      initialBlock,
      finalBlock,
      blockNumber,
      totalIssuance,
    } = src;

    const amplificationStr = StableMath.calculateAmplification(
      initialAmplification.toString(),
      finalAmplification.toString(),
      initialBlock.toString(),
      finalBlock.toString(),
      blockNumber.toString()
    );

    const amplification = BigInt(amplificationStr);
    const isRampPeriod = Number(amplificationStr) < finalAmplification;

    const stableSwapData: StableSwapBase = {
      id: Number(src.id),
      address,
      type,
      maxInRatio,
      maxOutRatio,
      minTradingLimit,
      amplification,
      isRampPeriod,
      totalIssuance: BigInt(totalIssuance),
      tokens: StableSwapOfflineUtils.getPoolTokensAugmented({
        poolId: src.id,
        poolTotalIssuance: totalIssuance,
        poolTokens: tokens,
        assets,
      }),
      ...StableSwapOfflineUtils.getStableswapPegsFromPersistentData({
        src,
        emaOraclesData,
        metaData,
        mmOraclesData,
      }),
    };

    return stableSwapData;
  }

  protected static decorateOmniPoolPersistentData(
    src: IPersistentOmniPoolBase
  ): OmniPoolBase {
    if (!src) throw new Error('Pool can not be empty');

    const { tokens, hubAssetId } = src;

    const basePoolData = OfflinePoolUtils.decorateBasePoolPersistentData(src);

    const omniPoolData: OmniPoolBase = {
      ...basePoolData,
      hubAssetId: Number(hubAssetId),
      tokens: tokens.map(OfflinePoolUtils.decorateOmniPoolToken),
    };

    return omniPoolData;
  }
}
