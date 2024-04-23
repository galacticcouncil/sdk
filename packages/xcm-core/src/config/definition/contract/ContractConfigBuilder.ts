import { Asset, AssetAmount } from '../../../asset';
import { AnyChain, Parachain } from '../../../chain';

import { ContractConfig } from './ContractConfig';

export interface ContractConfigBuilderParams {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: AnyChain;
  fee: AssetAmount;
  source: AnyChain;
  transactVia?: Parachain;
}

export interface ContractConfigBuilder {
  build: (params: ContractConfigBuilderParams) => ContractConfig;
}
