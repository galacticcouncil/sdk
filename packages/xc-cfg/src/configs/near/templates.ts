import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { near } from '../../assets';
import { FunctionCallBuilder } from '../../builders';
import { hydration } from '../../chains';
import { Tag } from '../../tags';

/**
 * Ntt transfer out of a NEAR locking manager, redeemed on hydration.
 *
 * - Paid in near gas, whatever the source asset
 * - A native near source is wrapped into the locked token first
 */
export function toHydrationViaNttTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: {
        asset: near,
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: 0,
        // Ntt delivers the full amount - nothing is taken on the far side.
        asset: assetOut,
      },
    },
    functionCall: FunctionCallBuilder().Wormhole().Ntt().transfer(),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}
