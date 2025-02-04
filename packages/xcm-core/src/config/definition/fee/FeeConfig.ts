import { BalanceConfigBuilder } from '../balance';
import { Asset } from '../../../asset';

import { FeeAssetConfigBuilder } from './FeeAssetConfigBuilder';
import { FeeAmountConfigBuilder } from './FeeAmountConfigBuilder';

export interface FeeConfig {
  asset: Asset | FeeAssetConfigBuilder;
  balance: BalanceConfigBuilder;
  extra?: number;
  swap?: boolean;
}

export interface DestinationFeeConfig {
  amount: number | FeeAmountConfigBuilder;
  asset: Asset;
  balance?: BalanceConfigBuilder;
}

export interface TransactFeeConfig {
  amount: number;
  asset: Asset;
  balance: BalanceConfigBuilder;
}
