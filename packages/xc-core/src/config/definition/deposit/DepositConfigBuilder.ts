import { TransferCtx } from '../../types';

import { DepositConfig } from './DepositConfig';

export interface DepositConfigBuilderParams extends TransferCtx {}

export interface DepositConfigBuilder {
  build: (params: DepositConfigBuilderParams) => Promise<DepositConfig[]>;
}
