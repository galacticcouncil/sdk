import { PoolPair } from '../../types';

import {
  HUB_ASSET_ID,
  PERMILL_DENOMINATOR,
  SYSTEM_ASSET_ID,
} from '../../../consts';
import { TEmaOracle } from '../../../oracle';
import { fmt } from '../../../utils';

import { OmniMath } from './OmniMath';
import { OmniPoolFees } from './OmniPool';
import {
  TAssetFeeParams,
  TDynamicFees,
  TDynamicFeeRange,
  TProtocolFeeParams,
} from './types';
const { FeeUtils } = fmt;

export class OmniPoolFee {
  static compute(
    pair: PoolPair,
    block: number,
    dynamicFee: TDynamicFees | undefined,
    oracleAssetFee: TEmaOracle | undefined,
    oracleProtocolFee: TEmaOracle | undefined,
    assetFeeParams: TAssetFeeParams,
    protocolFeeParams: TProtocolFeeParams,
    maxSlipFee: number
  ): OmniPoolFees {
    const protocolAsset = pair.assetIn;

    const [assetFeeMin, assetFee, assetFeeMax] = OmniPoolFee.getAssetFee(
      pair,
      block,
      dynamicFee,
      oracleAssetFee,
      assetFeeParams
    );

    let protocolFeeMin = 0;
    let protocolFee = 0;
    let protocolFeeMax = 0;
    if (protocolAsset !== HUB_ASSET_ID) {
      [protocolFeeMin, protocolFee, protocolFeeMax] =
        OmniPoolFee.getProtocolFee(
          pair,
          block,
          dynamicFee,
          oracleProtocolFee,
          protocolFeeParams
        );
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

  static getAssetFee(
    pair: PoolPair,
    block: number,
    dynamicFee: TDynamicFees | undefined,
    oracle: TEmaOracle | undefined,
    params: TAssetFeeParams
  ): TDynamicFeeRange {
    const { assetOut, balanceOut } = pair;
    const { min_fee, max_fee, decay, amplification } = params;

    if (!dynamicFee || !oracle) {
      return [min_fee, min_fee, max_fee];
    }

    const feeMin = FeeUtils.fromPermill(min_fee);
    const feeMax = FeeUtils.fromPermill(max_fee);

    const [entry] = oracle;
    const { asset_fee, timestamp } = dynamicFee;

    const blockDifference = Math.max(1, block - timestamp);

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

  static getProtocolFee(
    pair: PoolPair,
    block: number,
    dynamicFee: TDynamicFees | undefined,
    oracle: TEmaOracle | undefined,
    params: TProtocolFeeParams
  ): TDynamicFeeRange {
    const { assetIn, balanceIn } = pair;
    const { min_fee, max_fee, decay, amplification } = params;

    if (!dynamicFee || !oracle) {
      return [min_fee, min_fee, max_fee];
    }

    const feeMin = FeeUtils.fromPermill(min_fee);
    const feeMax = FeeUtils.fromPermill(max_fee);

    const [entry] = oracle;
    const { protocol_fee, timestamp } = dynamicFee;

    const blockDifference = Math.max(1, block - timestamp);

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
}
