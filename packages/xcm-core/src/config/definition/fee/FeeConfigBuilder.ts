import { ApiPromise } from '@polkadot/api';

import { SubstrateCallConfig } from '../base';
import { ChainAssetId } from '../../../chain';

export interface FeeConfigBuilderParams {
  asset: ChainAssetId;
  api: ApiPromise;
}

export interface FeeConfigBuilder {
  build: (params: FeeConfigBuilderParams) => SubstrateCallConfig;
}
