import { PERMILL_DENOMINATOR, SYSTEM_ASSET_ID } from '../../consts';
import { fmt } from '../../utils';
import { PoolPair } from '../types';

import { OmniMath } from './OmniMath';
import {
  TAssetFeeParams,
  TDynamicFees,
  TDynamicFeeRange,
  TEmaOracle,
  TProtocolFeeParams,
} from './types';

const { FeeUtils } = fmt;

export type AssetFeeInput = {
  pair: PoolPair;
  block: number;
  dynamicFee: TDynamicFees | undefined;
  oracle: TEmaOracle | undefined;
  params: TAssetFeeParams;
};

export type ProtocolFeeInput = {
  pair: PoolPair;
  block: number;
  dynamicFee: TDynamicFees | undefined;
  oracle: TEmaOracle | undefined;
  params: TProtocolFeeParams;
};

export class OmniPoolFee {
  static getAssetFee(input: AssetFeeInput): TDynamicFeeRange {
    const { pair, block, dynamicFee, oracle, params } = input;
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

  static getProtocolFee(input: ProtocolFeeInput): TDynamicFeeRange {
    const { pair, block, dynamicFee, oracle, params } = input;
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
