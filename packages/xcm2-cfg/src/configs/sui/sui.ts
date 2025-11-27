import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { sui } from '../../assets';
import { sui_chain, hydration, moonbeam } from '../../chains';
import { BalanceBuilder, MoveBuilder } from '../../builders';
import { Tag } from '../../tags';

const toHydrationViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: sui,
      balance: BalanceBuilder().sui().native(),
      destinationFee: {
        asset: sui,
        balance: BalanceBuilder().sui().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: sui,
      fee: {
        amount: 0,
        asset: sui,
      },
    },
    move: MoveBuilder()
      .Wormhole()
      .TokenBridge()
      .transferNativeWithPayload()
      .viaMrl({
        moonchain: moonbeam,
      }),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
];

export const suiConfig = new ChainRoutes({
  chain: sui_chain,
  routes: [...toHydrationViaWormhole],
});
