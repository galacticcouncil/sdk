import { TransferCtx } from '../../types';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams extends TransferCtx {}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => ContractConfig;
}
