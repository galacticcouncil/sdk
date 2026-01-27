import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { jito_sol, prime, sol } from '../../assets';
import { solana, hydration, moonbeam } from '../../chains';
import { BalanceBuilder, ProgramBuilder } from '../../builders';
import { Tag } from '../../tags';

import { toHydrationViaWormholeTemplate } from './template';

const toHydrationViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: sol,
      balance: BalanceBuilder().solana().native(),
      destinationFee: {
        asset: sol,
        balance: BalanceBuilder().solana().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: sol,
      fee: {
        amount: 0,
        asset: sol,
      },
    },
    program: ProgramBuilder()
      .Wormhole()
      .TokenBridge()
      .transferNativeWithPayload()
      .viaMrl({
        moonchain: moonbeam,
      }),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
  toHydrationViaWormholeTemplate(jito_sol, jito_sol),
  toHydrationViaWormholeTemplate(prime, prime),
];

export const solanaConfig = new ChainRoutes({
  chain: solana,
  routes: [...toHydrationViaWormhole],
});
