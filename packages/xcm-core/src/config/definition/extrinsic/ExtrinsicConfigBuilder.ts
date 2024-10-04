import { TransferData } from '../../types';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface ExtrinsicConfigBuilderParams extends TransferData {}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
