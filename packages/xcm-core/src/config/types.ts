import { Asset, AssetAmount } from '../asset';
import { AnyChain } from '../chain';

import { AssetConfig } from './definition';

export interface ChainTransferConfig {
  chain: AnyChain;
  config: AssetConfig;
}

export interface FeeSwap {
  amount: bigint;
  route: any;
  enabled: boolean;
}

export interface TransferConfig {
  asset: Asset;
  source: ChainTransferConfig;
  destination: ChainTransferConfig;
}

export interface TransferData {
  address: string;
  amount: bigint;
  asset: Asset;
  destination: {
    balance: AssetAmount;
    chain: AnyChain;
    fee: AssetAmount;
    feeBalance: AssetAmount;
  };
  sender: string;
  source: {
    balance: AssetAmount;
    chain: AnyChain;
    fee?: AssetAmount;
    feeBalance: AssetAmount;
    feeSwap?: FeeSwap;
  };
}
