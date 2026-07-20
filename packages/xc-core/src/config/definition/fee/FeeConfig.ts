import { Asset } from '../../../asset';

import { FeeAssetConfigBuilder } from './FeeAssetConfigBuilder';
import { FeeAmountConfigBuilder } from './FeeAmountConfigBuilder';

export interface FeeConfig {
  asset: Asset | FeeAssetConfigBuilder;
  extra?: number;
  swap?: boolean;
}

export interface DestinationFeeConfig {
  amount: number | FeeAmountConfigBuilder;
  asset: Asset;
}

export interface TransactFeeConfig {
  amount: number;
  asset: Asset;
}
