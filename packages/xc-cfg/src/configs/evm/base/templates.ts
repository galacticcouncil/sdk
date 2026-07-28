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
        asset: assetOut,
      },
    },
    contract: ContractBuilder().Wormhole().Ntt().transfer(),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}

export function toHydrationViaBasejumpTemplate(
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
        amount: FeeAmountBuilder().Basejump().quoteFee(),
        asset: assetIn,
      },
    },
    contract: ContractBuilder()
      .Basejump()
      .bridgeViaWormhole(),
    tags: [Tag.Basejump],
  });
}
