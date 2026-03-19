import { BigNumber, bnum, scale } from '../../../utils/bignumber';
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
import { StableMath, StableSwapBase } from '../../stable';
import { OmniPoolBase, OmniPoolToken } from '../../omni';
import { LbpPoolBase, WeightedPoolToken, LbpMath } from '../../lbp';
import { StableSwapOfflineUtils } from './StableSwapOfflineUtils';
import { FeeUtils } from '../../../utils/fee';

export const AMOUNT_MAX = BigInt('340282366920938463463374607431768211455');

export class OfflinePoolUtils {
  private static readonly MAX_FINAL_WEIGHT = scale(bnum(100), 6);

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
      // TODO add values validation

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
      symbol,
      balance,
      tradeable,
      tradable,
      name,
      existentialDeposit,
      type,
      isSufficient,
      icon,
      location,
      isWhiteListed,
    } = src;

    // TODO add values validation

    return {
      id,
      decimals,
      symbol,
      balance,
      tradeable: tradeable ?? tradable,
      name: name ?? '',
      existentialDeposit,
      type,
      isSufficient,
      icon: icon ?? '',
      location,
      isWhiteListed,
    };
  }

  protected static decorateOmniPoolToken(
    src: IPersistentOmniPoolToken
  ): OmniPoolToken {
    if (!src) throw new Error('Pool token can not be empty');

    const {
      id,
      decimals,
      symbol,
      balance,
      tradable,
      hubReserves,
      shares,
      cap,
      protocolShares,
      name,
      existentialDeposit,
      type,
      isSufficient,
      icon,
      location,
      isWhiteListed,
    } = src;

    // TODO add values validation

    return {
      tradeable: tradable,
      hubReserves: BigNumber(hubReserves),
      shares: BigNumber(shares),
      cap: BigNumber(cap),
      protocolShares: BigNumber(protocolShares),
      id,
      decimals,
      symbol,
      balance,
      name: name ?? '',
      existentialDeposit,
      type,
      isSufficient,
      icon: icon ?? '',
      location,
      isWhiteListed,
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

    // TODO add values validation

    return {
      id,
      address,
      type: OfflinePoolUtils.decoratePoolType(type),
      tokens: tokens.map(OfflinePoolUtils.decorateBasePoolToken),
      maxInRatio,
      maxOutRatio,
      minTradingLimit,
    };
  }

  protected static decorateLbpPoolPersistentData(
    src: IPersistentLbpPoolBase
  ): LbpPoolBase {
    if (!src) throw new Error('Pool can not be empty');

    const basePoolData = OfflinePoolUtils.decorateBasePoolPersistentData(src);

    // TODO check for active pool https://github.com/mckrava/hydration-sdk/blob/9f061a0680c9732216c82a2ea7e6bb7cbac5fba4/packages/sdk/src/pool/lbp/LbpPoolClient.ts#L34

    const {
      start,
      end,
      tokens,
      initialWeight,
      finalWeight,
      repayTarget,
      feeCollector,
      relayBlockNumber,
    } = src;

    const lbpPoolData: LbpPoolBase = {
      ...basePoolData,
      fee: src.fee as PoolFee,
      repayFeeApply: src.repayFeeApply, //TODO check implementation https://github.com/mckrava/hydration-sdk/blob/9f061a0680c9732216c82a2ea7e6bb7cbac5fba4/packages/sdk/src/pool/lbp/LbpPoolClient.ts#L137
    };

    const linearWeight = LbpMath.calculateLinearWeights(
      start.toString(),
      end.toString(),
      initialWeight.toString(),
      finalWeight.toString(),
      relayBlockNumber.toString()
    );

    const [accumulated, distributed] = tokens;
    const accumulatedAsset = accumulated.id.toString();
    const accumulatedWeight = bnum(linearWeight);
    const distributedAsset = distributed.id.toString();
    const distributedWeight = OfflinePoolUtils.MAX_FINAL_WEIGHT.minus(
      bnum(accumulatedWeight)
    );

    lbpPoolData.tokens = [
      {
        id: accumulatedAsset,
        weight: accumulatedWeight,
        balance: accumulated.balance.toString(),
      } as WeightedPoolToken,
      {
        id: distributedAsset,
        weight: distributedWeight,
        balance: distributed.balance.toString(),
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
      id,
      initialAmplification,
      finalAmplification,
      initialBlock,
      finalBlock,
      blockNumber,
      fee,
      totalIssuance,
    } = src;

    const amplification = StableMath.calculateAmplification(
      initialAmplification.toString(),
      finalAmplification.toString(),
      initialBlock.toString(),
      finalBlock.toString(),
      blockNumber.toString()
    );

    const stableSwapData: StableSwapBase = {
      id,
      address,
      type,
      fee: FeeUtils.fromPermill(fee),
      maxInRatio,
      maxOutRatio,
      minTradingLimit,
      amplification,
      totalIssuance,
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
      hubAssetId,
      tokens: tokens.map(OfflinePoolUtils.decorateOmniPoolToken),
    };

    return omniPoolData;
  }
}
