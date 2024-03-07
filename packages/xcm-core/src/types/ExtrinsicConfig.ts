import {
  ExtrinsicConfig,
  ExtrinsicConfigBuilderPrams,
} from '@moonbeam-network/xcm-builder';

export interface TxWeight {
  refTime: number;
  proofSize: string;
}

export interface TransactInfo {
  call: `0x${string}`;
  weight: TxWeight;
}

export interface ExtrinsicConfigBuilderParamsV2
  extends ExtrinsicConfigBuilderPrams {
  feeDecimals?: number;
  feePalletInstance?: number;
  transact?: TransactInfo;
}

export interface ExtrinsicConfigBuilderV2 {
  build: (params: ExtrinsicConfigBuilderParamsV2) => ExtrinsicConfig;
}
