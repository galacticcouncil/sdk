import { Asset } from 'asset';
import { AnyChain, EvmParachain } from '../../../chain';

export interface FeeConfigBuilderParams {
  asset: Asset;
  destination: AnyChain;
  source: AnyChain;
  via?: EvmParachain;
}

export interface FeeConfigBuilder {
  build: (params: FeeConfigBuilderParams) => Promise<bigint>;
}
