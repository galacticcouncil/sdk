import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import { ContractBuilder, FeeAmountBuilder } from '../../../builders';
import { hydration } from '../../../chains';
import { Tag } from '../../../tags';

export function toHydrationViaNttTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: {
        asset: eth,
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: 0,
        asset: assetIn,
      },
    },
    contract: ContractBuilder().Wormhole().Ntt().transfer(),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}

/**
 * Executor-delivered variant, offered alongside the self-redeem route above
 * for the same pair - the sender pays for delivery instead of signing a
 * redeem on the destination. Cost is native gas on the source chain.
 */
export function toHydrationViaNttExecutorTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: {
        asset: eth,
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder().Wormhole().quoteExecutorCost(),
        asset: eth,
      },
    },
    contract: ContractBuilder().Wormhole().Ntt().transferWithExecutor(),
    tags: [Tag.Wormhole, Tag.Ntt, Tag.NttExecutor],
  });
}

/**
 * Executor-delivered ntt out of a native gas source.
 *
 * The delivery price & executor cost come out of the very balance being
 * bridged, so they are already folded into the source fee - declaring them
 * as a destination fee too would charge the user twice.
 */
export function toHydrationViaNttExecutorNativeTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: {
        asset: eth,
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: 0,
        asset: assetIn,
      },
    },
    contract: ContractBuilder().Wormhole().Ntt().transferWithExecutor(),
    tags: [Tag.Wormhole, Tag.Ntt, Tag.NttExecutor],
  });
}
