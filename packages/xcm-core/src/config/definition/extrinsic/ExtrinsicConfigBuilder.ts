import { TransferData } from '../../types';
import { EvmParachain } from '../../../chain';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface TxWeight {
  refTime: number;
  proofSize: string;
}

export interface TransactInfo {
  call: `0x${string}`;
  weight: TxWeight;
}

export interface ExtrinsicConfigBuilderParams extends TransferData {
  transact?: TransactInfo;
  via?: EvmParachain;
}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
