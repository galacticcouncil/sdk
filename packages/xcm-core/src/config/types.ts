import { Asset } from '../asset';
import { AnyChain } from '../chain';

import { AssetConfig } from './definition';

export interface TransferConfig {
  asset: Asset;
  source: ChainTransferConfig;
  destination: ChainTransferConfig;
}

export interface ChainTransferConfig {
  chain: AnyChain;
  config: AssetConfig;
}
