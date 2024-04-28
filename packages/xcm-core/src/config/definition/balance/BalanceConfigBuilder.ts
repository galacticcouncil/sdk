import { SubstrateQueryConfig } from '../base';
import { ContractConfig } from '../contract';
import { ChainAssetId } from '../../../chain';

export interface BalanceConfigBuilderParams {
  address: string;
  asset: ChainAssetId;
}

export interface BalanceConfigBuilder {
  build: (
    params: BalanceConfigBuilderParams
  ) => SubstrateQueryConfig | ContractConfig;
}
