import { Binary } from 'polkadot-api';

import { AssetAmount } from '../../../asset';
import { AnyParachain } from '../../../chain';

import { TransferCtx } from '../../types';

import { ExtrinsicConfig } from './ExtrinsicConfig';

export interface TxWeight {
  proofSize: bigint;
  refTime: bigint;
}

export interface TransactCtx {
  chain: AnyParachain;
  fee: AssetAmount;
  feeBalance: AssetAmount;
  call: Binary;
  weight: TxWeight;
}

export interface ExtrinsicConfigBuilderParams extends TransferCtx {
  messageId?: string;
  transact?: TransactCtx;
}

export interface ExtrinsicConfigBuilder {
  build: (params: ExtrinsicConfigBuilderParams) => ExtrinsicConfig;
}
