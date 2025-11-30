import { SubstrateQueryConfig } from '../base';
import { ChainAssetId } from '../../../chain';

export interface MinConfigBuilder {
  build: (params: MinConfigBuilderParams) => SubstrateQueryConfig;
}

export interface MinConfigBuilderParams {
  asset: ChainAssetId;
}
