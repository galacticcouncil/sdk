import { BalanceConfigBuilder } from '../balance';
import { Asset } from '../../../asset';

import { FeeConfigBuilder } from './FeeConfigBuilder';

export interface FeeAssetConfig {
  asset: Asset;
  balance: BalanceConfigBuilder;
  xcmDeliveryFeeAmount?: number;
}

export interface DestinationFeeConfig extends FeeAssetConfig {
  amount: number | FeeConfigBuilder;
}
