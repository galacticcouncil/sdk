import { Asset } from '../../../asset';
import { AnyParachain } from '../../../chain';

export interface FeeAssetConfigParams {
  address: string;
  chain: AnyParachain;
}

export interface FeeAssetConfigBuilder {
  build: (params: FeeAssetConfigParams) => Promise<Asset>;
}
