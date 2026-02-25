import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import {
  BalanceBuilder,
  ContractBuilder,
} from '../../../builders';
import { hydration, moonbeam } from '../../../chains';
import { Tag } from '../../../tags';

export function toHydrationViaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        asset: assetIn,
        balance: BalanceBuilder().evm().erc20(),
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
    contract: ContractBuilder()
      .Wormhole()
      .TokenBridge()
      .transferTokensWithPayload()
      .viaMrl({ moonchain: moonbeam }),
    tags: [Tag.Mrl, Tag.Wormhole],
  });
}
