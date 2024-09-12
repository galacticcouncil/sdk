import { Asset, AssetAmount } from '../asset';
import { AnyChain } from '../chain';

import { AssetConfig } from './definition';

export interface ChainTransferConfig {
  chain: AnyChain;
  config: AssetConfig;
}

export interface TransferConfig {
  asset: Asset;
  source: ChainTransferConfig;
  destination: ChainTransferConfig;
}

export interface TransferSwap {
  amount: bigint;
  route: any;
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
  swap?: TransferSwap;
}
