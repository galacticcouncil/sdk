import { Asset, AssetAmount } from '../asset';
import { AnyChain } from '../chain';

import { AssetConfig } from './definition';

export interface TransferConfig {
  asset: Asset;
  source: ChainTransferConfig;
  destination: ChainTransferConfig;
}

export interface TransferData {
  address: string;
  amount: bigint;
  asset: Asset;
  balance: AssetAmount;
  destination: {
    chain: AnyChain;
    fee: AssetAmount;
    feeBalance: AssetAmount;
  };
  sender: string;
  source: {
    chain: AnyChain;
    fee?: AssetAmount;
    feeBalance: AssetAmount;
  };
}

export interface ChainTransferConfig {
  chain: AnyChain;
  config: AssetConfig;
}
