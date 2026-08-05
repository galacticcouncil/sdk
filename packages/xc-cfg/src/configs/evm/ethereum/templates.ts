import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import { ContractBuilder, FeeAmountBuilder } from '../../../builders';
import { hydration, assetHub } from '../../../chains';
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
        // Ntt delivers the full amount - nothing is taken on the far side.
        // Denominated in the source asset: the destination fee balance is
        // read on the source chain, where assetOut may not be registered.
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
 * redeem on the destination.
 *
 * The cost is native gas on the source chain, declared as the destination fee
 * because an erc20 source pays it from a balance the amount never competes
 * for (which is why EvmPlatform.estimateFee leaves the call value out there).
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
        // Denominated in the source asset: the destination fee balance is
        // read on the source chain, where assetOut may not be registered.
        asset: assetIn,
      },
    },
    contract: ContractBuilder().Wormhole().Ntt().transferWithExecutor(),
    tags: [Tag.Wormhole, Tag.Ntt, Tag.NttExecutor],
  });
}

export function toHydrationViaSnowbridgeTemplate(
  assetIn: Asset,
  assetOut: Asset
) {
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
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateInboundFee({ hub: assetHub }),
        asset: eth,
      },
    },
    contract: ContractBuilder().Snowbridge().v2SendMessage(),
    tags: [Tag.Snowbridge],
  });
}

// Snowbridge V1 (legacy) inbound route (Ethereum -> Hydration). Direct Gateway
// sendToken call with the flat V1 bridge fee quoted on-chain — cheaper than the
// V2 v2_sendMessage path.
export function toHydrationViaSnowbridgeV1Template(
  assetIn: Asset,
  assetOut: Asset
) {
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
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateInboundFeeV1({ hub: assetHub }),
        asset: eth,
      },
    },
    contract: ContractBuilder().Snowbridge().sendToken(),
    tags: [Tag.Snowbridge, Tag.SnowbridgeV1],
  });
}
