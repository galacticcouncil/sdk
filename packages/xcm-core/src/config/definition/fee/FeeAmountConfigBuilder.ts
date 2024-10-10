import { Asset } from '../../../asset';
import { AnyChain } from '../../../chain';

export interface FeeAmountConfigParams {
  asset: Asset;
  source: AnyChain;
  destination: AnyChain;
}

export interface FeeAmountConfigBuilder {
  build: (params: FeeAmountConfigParams) => Promise<bigint>;
}
