import { Asset, AssetAmount } from '../../../asset';
import { AnyChain, Parachain } from '../../../chain';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface TxWeight {
  refTime: number;
  proofSize: string;
}

export interface TransactInfo {
  call: `0x${string}`;
  weight: TxWeight;
}

export interface ExtrinsicConfigBuilderParams {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: AnyChain;
  fee: AssetAmount;
  sender: string;
  source: AnyChain;
  transact?: TransactInfo;
  transactVia?: Parachain;
}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
