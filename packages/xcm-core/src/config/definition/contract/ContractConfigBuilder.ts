import { TransferData } from '../../types';
import { EvmParachain } from '../../../chain';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams extends TransferData {
  via?: EvmParachain;
}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => ContractConfig;
}
