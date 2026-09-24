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
  /**
   * Charged on the source chain on top of the amount.
   *
   * - Unset: a fee sharing the transfer asset is taken out of what lands
   * - Set: the sender pays it separately, so max and the fee check reserve
   *   it even when it shares the transfer asset
   */
  prepaid?: boolean;
}
