import { AnyChain, Asset } from '@moonbeam-network/xcm-types';
import { AssetConfig } from './configs';

export interface TransferConfig {
  asset: Asset;
  source: ChainTransferConfig;
  destination: ChainTransferConfig;
}

export interface ChainTransferConfig {
  chain: AnyChain;
  config: AssetConfig;
}
