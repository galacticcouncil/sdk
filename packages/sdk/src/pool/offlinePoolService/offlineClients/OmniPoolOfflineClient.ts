import { OfflinePoolClient } from './OfflinePoolClient';
import {
  AssetDynamicFee,
  EmaOraclePeriod,
  EmaOracleSource,
  IOfflinePoolServiceDataSource,
  IPersistentEmaOracleEntryData,
} from '../types';
import { PoolFees, PoolLimits, PoolPair, PoolType } from '../../types';
import {
  HUB_ASSET_ID,
  HYDRADX_SS58_PREFIX,
  PERMILL_DENOMINATOR,
  SYSTEM_ASSET_ID,
} from '../../../consts';
import { OmniPoolFees, OmniMath } from '../../omni';
import { FeeUtils } from '../../../utils/fee';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';

type OmniPoolFeeRange = [number, number, number];

export class OmniPoolOfflineClient extends OfflinePoolClient {
  constructor(dataSource: IOfflinePoolServiceDataSource) {
    super(dataSource, PoolType.Omni);
  }

  isSupported(): boolean {
    return this.pools.length > 0;
  }

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

  async getPoolFees(
    block: number,
    poolPair: PoolPair,
    _address: string
  ): Promise<PoolFees> {
    const feeAsset = poolPair.assetOut;
    const protocolAsset = poolPair.assetIn;

    const oracleName = 'omnipool';
    const oraclePeriod = 'Short';

    const oracleKey = (asset: string) => {
      return (
        asset === SYSTEM_ASSET_ID
          ? [SYSTEM_ASSET_ID, HUB_ASSET_ID]
          : [HUB_ASSET_ID, asset]
      ).join('-');
    };

    const dynamicFees = this.getAssetDynamicFee(feeAsset);

    if (!dynamicFees) throw Error('Dynamic fees not found for pool type Omni');

    const blockNumber = block ?? this.dataSourceMeta.paraBlockNumber;
    const oracleAssetFee = this.getAssetEmaOracleEntry(
      oracleName,
      oraclePeriod,
      oracleKey(feeAsset)
    );

    const oracleProtocolFee =
      protocolAsset !== HUB_ASSET_ID
        ? this.getAssetEmaOracleEntry(
            oracleName,
            oraclePeriod,
            oracleKey(protocolAsset)
          )
        : null;

    const [assetFeeMin, assetFee, assetFeeMax] = this.getAssetFee(
      poolPair,
      blockNumber,
      dynamicFees,
      oracleAssetFee
    );

    const [protocolFeeMin, protocolFee, protocolFeeMax] =
      protocolAsset === HUB_ASSET_ID || !oracleProtocolFee
        ? [0, 0, 0] // No protocol fee for LRNA sell
        : this.getProtocolFee(
            poolPair,
            blockNumber,
            dynamicFees,
            oracleProtocolFee!
          );

    const min = assetFeeMin + protocolFeeMin;
    const max = assetFeeMax + protocolFeeMax;

    const maxSlipFee = this.extras.omnipool.maxSlipFee;

    return {
      assetFee: FeeUtils.fromPermill(assetFee),
      protocolFee: FeeUtils.fromPermill(protocolFee),
      min: FeeUtils.fromPermill(min),
      max: FeeUtils.fromPermill(max),
      maxSlipFee: FeeUtils.fromPermill(maxSlipFee),
    } as OmniPoolFees;
  }

  /**
   * @param entryKey - <asset_a_id>-<asset_b_id>
   */
  protected getAssetEmaOracleEntry(
    source: EmaOracleSource,
    period: EmaOraclePeriod,
    entryKey: string
  ): IPersistentEmaOracleEntryData {
    if (!this.emaOracleEntries.has(source))
      throw Error(`EmaOracle entries not found for pool type ${source}`);

    if (!this.emaOracleEntries.get(source)!.has(period))
      throw Error(
        `EmaOracle entries not found for pool type ${source} and period ${period}`
      );

    if (!this.emaOracleEntries.get(source)!.get(period)!.has(entryKey))
      throw Error(
        `EmaOracle entries not found for pool type ${source}, period ${period}, entry key ${entryKey}`
      );

    return this.emaOracleEntries.get(source)!.get(period)!.get(entryKey)!;
  }

  private getAssetFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: AssetDynamicFee,
    oracleEntry: IPersistentEmaOracleEntryData
  ): OmniPoolFeeRange {
    const { assetOut, balanceOut } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      this.constants.dynamicFeesAssetFeeParameters;

    const feeMin = FeeUtils.fromPermill(minFee);
    const feeMax = FeeUtils.fromPermill(maxFee);

    if (!dynamicFee || !oracleEntry) {
      return [minFee, minFee, maxFee];
    }

    const { assetFee, timestamp } = dynamicFee;

    const blockDifference = blockNumber - timestamp;

    let oracleAmountIn = oracleEntry.volume.bIn;
    let oracleAmountOut = oracleEntry.volume.bOut;
    let oracleLiquidity = oracleEntry.liquidity.b;

    if (assetOut === SYSTEM_ASSET_ID) {
      oracleAmountIn = oracleEntry.volume.aIn;
      oracleAmountOut = oracleEntry.volume.aOut;
      oracleLiquidity = oracleEntry.liquidity.a;
    }

    const feePrev = FeeUtils.fromPermill(assetFee);
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
    return [minFee, Number(fee) * PERMILL_DENOMINATOR, maxFee];
  }

  private getProtocolFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: AssetDynamicFee,
    oracleEntry: IPersistentEmaOracleEntryData
  ): OmniPoolFeeRange {
    const { assetIn, balanceIn } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      this.constants.dynamicFeesProtocolFeeParameters;

    const feeMin = FeeUtils.fromPermill(minFee);
    const feeMax = FeeUtils.fromPermill(maxFee);

    if (!dynamicFee || !oracleEntry) {
      return [minFee, minFee, maxFee];
    }

    const { protocolFee, timestamp } = dynamicFee;

    const blockDifference = Math.max(1, blockNumber - timestamp);

    let oracleAmountIn = oracleEntry.volume.bIn.toString();
    let oracleAmountOut = oracleEntry.volume.bOut.toString();
    let oracleLiquidity = oracleEntry.liquidity.b.toString();

    if (assetIn === SYSTEM_ASSET_ID) {
      oracleAmountIn = oracleEntry.volume.aIn.toString();
      oracleAmountOut = oracleEntry.volume.aOut.toString();
      oracleLiquidity = oracleEntry.liquidity.a.toString();
    }

    const feePrev = FeeUtils.fromPermill(protocolFee);
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
    return [minFee, Number(fee) * PERMILL_DENOMINATOR, maxFee];
  }
}
