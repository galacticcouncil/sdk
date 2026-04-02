import {
  IPersistentEmaOracleEntry,
  IPersistentMetaData,
  IPersistentMmOracleEntry,
  IPersistentStableSwapBase,
  IPersistentStableSwapBasePegSource,
  IPersistentPoolToken,
  PersistentAsset,
} from '../types';
import { StableMath, StableSwapBase } from '../../stable';
import { PERMILL_DENOMINATOR, TRADEABLE_DEFAULT } from '../../../consts';
import { PoolFee, PoolToken } from '../../types';
import { OfflinePoolUtils } from './OfflinePoolUtils';
import { fmt } from '../../../utils';

const { FeeUtils } = fmt;

type Peg = {
  pair: string[];
  updatedAt: string;
  source?: string;
};

export class StableSwapOfflineUtils {
  static getStableswapPegsFromPersistentData({
    src,
    emaOraclesData,
    mmOraclesData,
    metaData,
  }: {
    src: IPersistentStableSwapBase;
    emaOraclesData: IPersistentEmaOracleEntry[];
    mmOraclesData: IPersistentMmOracleEntry[];
    metaData: IPersistentMetaData;
  }): Pick<StableSwapBase, 'pegs' | 'fee'> {
    if (!src.pegSources) {
      return this.getPoolDefaultPegs({
        poolFee: src.fee,
        assets: src.tokens,
      });
    }

    if (!src.maxPegUpdate)
      throw Error(`Max peg update for ${src.id} has not been found`);

    const sortedAssetIds = src.tokens
      .map((t) => Number(t.id))
      .sort((a, b) => a - b)
      .map((id) => id.toString());

    const latestPegs = StableSwapOfflineUtils.getLatestPegs({
      poolAssetIds: sortedAssetIds,
      pegSources: src.pegSources,
      blockNumber: metaData.paraBlockNumber.toString(),
      emaOraclesData,
      mmOraclesData,
    });
    const recentPegs = src.pegs!;
    const fee = src.fee;
    const maxPegUpdate = src.maxPegUpdate!;

    const targetPeg = latestPegs.find((p) => p.source);

    const currentPegsUpdatedAt =
      src && src.pegsUpdatedAtParaBlock
        ? src.pegsUpdatedAtParaBlock.toString()
        : targetPeg?.updatedAt;

    if (!currentPegsUpdatedAt) {
      throw Error(src.id + ' current peg unknown');
    }

    const latestPegsDecorated = latestPegs.map(({ pair, updatedAt }) => [
      pair,
      updatedAt,
    ]);

    const [updatedFee, updatedPegs] = StableMath.recalculatePegs(
      JSON.stringify(recentPegs),
      currentPegsUpdatedAt,
      JSON.stringify(latestPegsDecorated),
      metaData.paraBlockNumber.toString(),
      // TODO this calculation must be refactored to use FeeUtils.toRaw
      (maxPegUpdate / 10000).toFixed(2),
      // TODO this calculation must be refactored to use FeeUtils.toRaw
      (fee / 10000).toFixed(2)
    );

    const updatedFeePermill = Number(updatedFee) * PERMILL_DENOMINATOR;
    return {
      fee: FeeUtils.fromPermill(updatedFeePermill),
      pegs: updatedPegs,
    };
  }

  protected static getPoolDefaultPegs({
    poolFee,
    assets,
  }: {
    poolFee: number;
    assets: Array<IPersistentPoolToken | PersistentAsset>;
  }): { fee: PoolFee; pegs: string[][] } {
    const defaultPegs = StableMath.defaultPegs(assets.length);
    return {
      fee: FeeUtils.fromPermill(poolFee),
      pegs: defaultPegs,
    };
  }

  private static getLatestPegs({
    poolAssetIds,
    pegSources,
    blockNumber,
    emaOraclesData,
    mmOraclesData,
  }: {
    poolAssetIds: string[];
    pegSources: IPersistentStableSwapBasePegSource[];
    blockNumber: string;
    emaOraclesData: IPersistentEmaOracleEntry[];
    mmOraclesData: IPersistentMmOracleEntry[];
  }): Peg[] {
    const emaOraclesDecoratedMap =
      OfflinePoolUtils.decorateEmaOraclesPersistentData(emaOraclesData);

    const fallbackPegs = {
      pair: Array(poolAssetIds.length).fill('1'),
      updatedAt: blockNumber,
      source: 'value',
    };

    const latest = pegSources.map((source, i) => {
      switch (source.sourceKind) {
        case 'Oracle': {
          const { oracleName, oraclePeriod, oracleAsset } = source;

          const oracleKeyList = [oracleAsset, poolAssetIds[i]]
            .map((a) => Number(a))
            .sort((a, b) => a - b);

          const oracleEntry = emaOraclesDecoratedMap
            .get(oracleName!)!
            .get(oraclePeriod!)!
            .get(oracleKeyList.join('-'));

          if (!oracleEntry) throw Error(`EmaOracleEntry has not been found`);

          const { price, updatedAt } = oracleEntry;

          const priceNum = price.n.toString();
          const priceDenom = price.d.toString();

          const pair =
            `${oracleAsset}` === oracleKeyList[0].toString()
              ? [priceNum, priceDenom]
              : [priceDenom, priceNum];

          return { pair, updatedAt: updatedAt.toString(), source: 'ema' };
        }
        case 'MmOracle':
        case 'MMOracle': {
          const h160Address = source.oracleName;
          const oracleData = mmOraclesData.find(
            (data) => data.address === h160Address
          );
          if (!oracleData)
            throw Error(
              `MmOracleEntry has not been found for contract ${h160Address}`
            );

          const { price, decimals, updatedAt } = oracleData;

          const priceDenom = 10 ** decimals;

          const pair = [price.toString(), priceDenom.toString()];
          return { pair, updatedAt: updatedAt.toString(), source: 'mm' };
        }
        default:
          if (!source.valuePoints) return fallbackPegs;
          const pair = source.valuePoints!.map((p) => p.toString());
          return { pair, updatedAt: blockNumber, source: 'value' };
      }
    });

    return latest;
  }

  static getPoolTokensAugmented({
    poolId,
    poolTotalIssuance,
    poolTokens,
    assets,
  }: {
    poolId: string;
    poolTotalIssuance: string;
    poolTokens: PoolToken[];
    assets: Array<PersistentAsset>;
  }): PoolToken[] {
    const poolShareAsset = assets.find((a) => a.id === poolId);
    if (!poolShareAsset) throw Error(`Pool share asset has not been found`);

    return [
      ...poolTokens,
      OfflinePoolUtils.decorateBasePoolToken({
        id: poolShareAsset.id,
        decimals: poolShareAsset.decimals,
        symbol: poolShareAsset.symbol,
        balance: poolTotalIssuance,
        existentialDeposit: poolShareAsset.existentialDeposit,
        isSufficient: poolShareAsset.isSufficient,
        type: poolShareAsset.type,
        tradable: TRADEABLE_DEFAULT,
      }),
    ];
  }
}
