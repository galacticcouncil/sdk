import { Asset } from '../../../asset';
import { AnyChain, EvmParachain } from '../../../chain';

export interface FeeAmountConfigParams {
  asset: Asset;
  destination: AnyChain;
  source: AnyChain;
  via?: EvmParachain;
}

export interface FeeAmountConfigBuilder {
  build: (params: FeeAmountConfigParams) => Promise<bigint>;
}
