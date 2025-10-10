import {
  HydrationConstants,
  HydrationQueries,
} from '@galacticcouncil/descriptors';

export type TDynamicFees = HydrationQueries['DynamicFees']['AssetFee']['Value'];
export type TDynamicFeesConfig =
  HydrationQueries['DynamicFees']['AssetFeeConfiguration']['Value'];

export type TAssetFeeParams =
  HydrationConstants['DynamicFees']['AssetFeeParameters'];
export type TProtocolFeeParams =
  HydrationConstants['DynamicFees']['ProtocolFeeParameters'];

export type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];
export type TOmnipoolAsset = HydrationQueries['Omnipool']['Assets']['Value'];

export type TOmnipoolFeeRange = [number, number, number];
