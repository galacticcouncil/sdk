import { TransferCtx } from '../../types';

import { FunctionCallConfig } from './FunctionCallConfig';

export interface FunctionCallConfigBuilderParams extends TransferCtx {}

export interface FunctionCallConfigBuilder {
  build: (
    params: FunctionCallConfigBuilderParams
  ) => Promise<FunctionCallConfig[]>;
}
