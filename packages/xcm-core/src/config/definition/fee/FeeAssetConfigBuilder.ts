import { Asset } from '../../../asset';
import { Parachain } from '../../../chain';

export interface FeeAssetConfigParams {
  address: string;
  chain: Parachain;
}

export interface FeeAssetConfigBuilder {
  build: (params: FeeAssetConfigParams) => Promise<Asset>;
}
