import { Asset, AssetAmount } from '../../../asset';
import { AnyChain, EvmParachain } from '../../../chain';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: AnyChain;
  fee: AssetAmount;
  source: AnyChain;
  via?: EvmParachain;
}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => ContractConfig;
}
