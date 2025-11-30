import { TransferCtx } from '../../types';

import { MoveConfig } from './MoveConfig';

export interface MoveConfigBuilderParams extends TransferCtx {}

export interface MoveConfigBuilder {
  build: (params: MoveConfigBuilderParams) => Promise<MoveConfig>;
}
