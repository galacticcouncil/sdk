import { ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { AnyChain, Asset, AssetAmount } from '@moonbeam-network/xcm-types';

export interface TxWeight {
  refTime: number;
  proofSize: string;
}

export interface TransactInfo {
  call: `0x${string}`;
  weight: TxWeight;
}

/* export interface ExtrinsicConfigBuilderParamsV2
  extends ExtrinsicConfigBuilderPrams {
  feeDecimals?: number;
  feePalletInstance?: number;
  routedVia?: AnyChain;
  transact?: TransactInfo;
} */

export interface ExtrinsicConfigBuilderParamsV2 {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: AnyChain;
  fee: AssetAmount;
  source: AnyChain;
  routedVia?: AnyChain;
  transact?: TransactInfo;
}

export interface ExtrinsicConfigBuilderV2 {
  build: (params: ExtrinsicConfigBuilderParamsV2) => ExtrinsicConfig;
}
