import { TransferCtx, TransferDeposit } from '../../types';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams extends TransferCtx {}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => Promise<ContractConfig[]>;
  /** Opens the deposit address a route pays, before signing. */
  openDeposit?: (
    params: ContractConfigBuilderParams
  ) => Promise<TransferDeposit>;
}
