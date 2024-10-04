import { TransferData } from '../../types';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams extends TransferData {}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => ContractConfig;
}
