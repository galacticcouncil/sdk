import { TransferCtx } from '../../types';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface ExtrinsicConfigBuilderParams extends TransferCtx {
  messageId?: string;
}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => Promise<ExtrinsicConfig>;
}
