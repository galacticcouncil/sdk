import {
  HydrationNextQueries,
  HydrationConstants,
  HydrationQueries,
} from '@galacticcouncil/descriptors';

import { TEmaOracle } from '../../../oracle';

export type TDynamicFees = HydrationQueries['DynamicFees']['AssetFee']['Value'];
export type TDynamicFeesConfig =
  HydrationQueries['DynamicFees']['AssetFeeConfiguration']['Value'];
export type TDynamicFeeRange = [number, number, number];

export type TSlipFee = HydrationNextQueries['Omnipool']['SlipFee']['Value'];

export type TAssetFeeParams =
  HydrationConstants['DynamicFees']['AssetFeeParameters'];
export type TProtocolFeeParams =
  HydrationConstants['DynamicFees']['ProtocolFeeParameters'];

export type TOmnipoolAsset = HydrationQueries['Omnipool']['Assets']['Value'];

export interface OmniSnapshot {
  dynamicFees: { asset: number; fee: TDynamicFees }[];
  emaOracles: { pair: [number, number]; oracle: TEmaOracle }[];
  assetFeeParams: TAssetFeeParams;
  protocolFeeParams: TProtocolFeeParams;
  maxSlipFee: number;
}
