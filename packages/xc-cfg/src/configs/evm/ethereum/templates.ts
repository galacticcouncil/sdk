import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import { ContractBuilder, FeeAmountBuilder } from '../../../builders';
import { hydration, moonbeam, assetHub } from '../../../chains';
import { Tag } from '../../../tags';

export function toHydrationViaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      fee: {
        asset: eth,
      },
      destinationFee: assetIn,
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: 0,
        asset: assetOut,
      },
    },
    contract: ContractBuilder()
      .Wormhole()
      .TokenBridge()
      .transferTokensWithPayload()
      .viaMrl({ moonchain: moonbeam }),
    tags: [Tag.Mrl, Tag.Wormhole],
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
