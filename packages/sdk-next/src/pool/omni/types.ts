import { FixedSizeArray } from 'polkadot-api';

import {
  HydrationConstants,
  HydrationQueries,
} from '@galacticcouncil/descriptors';

export type TDynamicFees = HydrationQueries['DynamicFees']['AssetFee']['Value'];
export type TDynamicFeesConfig =
  HydrationQueries['DynamicFees']['AssetFeeConfiguration']['Value'];
export type TDynamicFeeRange = [number, number, number];

export type TAssetFeeParams =
  HydrationConstants['DynamicFees']['AssetFeeParameters'];
export type TProtocolFeeParams =
  HydrationConstants['DynamicFees']['ProtocolFeeParameters'];

export type TEmaOracle = HydrationQueries['EmaOracle']['Oracles']['Value'];
export type TEmaPair = FixedSizeArray<2, number>;

export type TOmnipoolAsset = HydrationQueries['Omnipool']['Assets']['Value'];
