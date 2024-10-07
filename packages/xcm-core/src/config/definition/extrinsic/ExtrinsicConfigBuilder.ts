import { TransferCtx } from '../../types';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface ExtrinsicConfigBuilderParams extends TransferCtx {}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
