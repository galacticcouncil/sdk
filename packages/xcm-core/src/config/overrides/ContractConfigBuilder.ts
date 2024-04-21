import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { AnyChain, Asset, AssetAmount } from '@moonbeam-network/xcm-types';

/* export interface ContractConfigBuilderParamsV2
  extends ContractConfigBuilderPrams {
  source: AnyChain;
  routedVia?: AnyChain;
} */

export interface ContractConfigBuilderParamsV2 {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: AnyChain;
  fee: AssetAmount;
  source: AnyChain;
  routedVia?: AnyChain;
}

export interface ContractConfigBuilderV2 {
  build: (params: ContractConfigBuilderParamsV2) => ContractConfig;
}
