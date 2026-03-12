import { Asset, AssetRoute } from '@galacticcouncil/xcm-core';

import { sol } from '../../assets';
import { BalanceBuilder, ProgramBuilder } from '../../builders';
import { hydration, moonbeam } from '../../chains';
import { Tag } from '../../tags';

export function toHydrationViaWormholeTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      balance: BalanceBuilder().solana().token(),
      fee: {
        asset: sol,
        balance: BalanceBuilder().solana().native(),
      },
      destinationFee: {
        asset: assetIn,
        balance: BalanceBuilder().solana().token(),
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
    program: ProgramBuilder()
      .Wormhole()
      .TokenBridge()
      .transferTokenWithPayload()
      .viaMrl({
        moonchain: moonbeam,
      }),
    tags: [Tag.Mrl, Tag.Wormhole],
  });
}
