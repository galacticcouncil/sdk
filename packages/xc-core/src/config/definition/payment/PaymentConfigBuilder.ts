import { TransferCtx } from '../../types';

import { PaymentConfig } from './PaymentConfig';

export interface PaymentConfigBuilderParams extends TransferCtx {}

export interface PaymentConfigBuilder {
  build: (params: PaymentConfigBuilderParams) => Promise<PaymentConfig[]>;
}
