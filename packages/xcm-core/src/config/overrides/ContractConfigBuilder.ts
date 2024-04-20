import {
  ContractConfig,
  ContractConfigBuilderPrams,
} from '@moonbeam-network/xcm-builder';
import { AnyChain } from '@moonbeam-network/xcm-types';

export interface ContractConfigBuilderParamsV2
  extends ContractConfigBuilderPrams {
  source: AnyChain;
}

export interface ContractConfigBuilderV2 {
  build: (params: ContractConfigBuilderParamsV2) => ContractConfig;
}
