import { BalanceConfigBuilder } from '../balance';
import { Asset } from '../../../asset';

import { FeeAssetConfigBuilder } from './FeeAssetConfigBuilder';
import { FeeAmountConfigBuilder } from './FeeAmountConfigBuilder';

export interface FeeConfig {
  asset: Asset | FeeAssetConfigBuilder;
  balance: BalanceConfigBuilder;
  xcmDeliveryFeeAmount?: number;
}

export interface DestinationFeeConfig extends FeeConfig {
  asset: Asset;
  amount: number | FeeAmountConfigBuilder;
}
