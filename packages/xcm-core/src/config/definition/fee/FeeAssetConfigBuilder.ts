import { SubstrateCallConfig } from '../base';
import { Parachain } from '../../../chain';

export interface FeeAssetConfigBuilder {
  build: (params: FeeAssetConfigParams) => SubstrateCallConfig;
}

export interface FeeAssetConfigParams {
  address: string;
  chain: Parachain;
}
