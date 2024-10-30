import { SubstrateQueryConfig } from '../base';
import { ContractConfig } from '../contract';
import { Asset } from '../../../asset';
import { AnyChain } from '../../../chain';

export interface BalanceConfigBuilderParams {
  address: string;
  asset: Asset;
  chain: AnyChain;
}

export interface BalanceConfigBuilder {
  build: (
    params: BalanceConfigBuilderParams
  ) => SubstrateQueryConfig | ContractConfig;
}
