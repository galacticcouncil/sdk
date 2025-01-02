import { AssetAmount } from '../../../asset';
import { AnyParachain } from '../../../chain';

import { TransferCtx } from '../../types';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface TxWeight {
  proofSize: string;
  refTime: number;
}

export interface TransactCtx {
  chain: AnyParachain;
  fee: AssetAmount;
  feeBalance: AssetAmount;
  call: `0x${string}`;
  weight: TxWeight;
}

export interface ExtrinsicConfigBuilderParams extends TransferCtx {
  transact?: TransactCtx;
}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
