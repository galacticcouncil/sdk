import { SubstrateQueryConfig } from '../base';
import { ContractConfig } from '../contract';
import { ChainAssetId } from '../../../chain';

export interface BalanceConfigBuilder {
  build: (
    params: BalanceConfigBuilderParams
  ) => SubstrateQueryConfig | ContractConfig;
}

export interface BalanceConfigBuilderParams {
  address: string;
  asset: ChainAssetId;
}
