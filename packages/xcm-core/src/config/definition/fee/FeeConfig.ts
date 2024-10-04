import { BalanceConfigBuilder } from '../balance';
import { Asset } from '../../../asset';

import { FeeAssetConfigBuilder } from './FeeAssetConfigBuilder';
import { FeeAmountConfigBuilder } from './FeeAmountConfigBuilder';

export interface FeeConfig {
  asset: Asset | FeeAssetConfigBuilder;
  balance: BalanceConfigBuilder;
  extra?: number;
}

export interface DestinationFeeConfig extends FeeConfig {
  asset: Asset;
  amount: number | FeeAmountConfigBuilder;
}

export interface RouteFeeConfig extends FeeConfig {
  asset: Asset;
  amount: number;
}
