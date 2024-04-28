import { Asset } from 'asset';
import { AnyChain } from '../../../chain';

export interface FeeConfigBuilderParams {
  asset: Asset;
  destination: AnyChain;
  source: AnyChain;
}

export interface FeeConfigBuilder {
  build: (params: FeeConfigBuilderParams) => Promise<bigint>;
}
