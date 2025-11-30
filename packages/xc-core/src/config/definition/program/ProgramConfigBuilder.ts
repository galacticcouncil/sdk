import { TransferCtx } from '../../types';

import { ProgramConfig } from './ProgramConfig';

export interface ProgramConfigBuilderParams extends TransferCtx {}

export interface ProgramConfigBuilder {
  build: (params: ProgramConfigBuilderParams) => Promise<ProgramConfig>;
}
