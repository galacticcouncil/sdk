import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { jito_sol, sol } from '../../assets';
import { solana, hydration, moonbeam } from '../../chains';
import { BalanceBuilder, ProgramBuilder } from '../../builders';
import { Tag } from '../../tags';

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
  new AssetRoute({
    source: {
      asset: jito_sol,
      balance: BalanceBuilder().solana().token(),
      fee: {
        asset: sol,
        balance: BalanceBuilder().solana().native(),
      },
      destinationFee: {
        asset: jito_sol,
        balance: BalanceBuilder().solana().token(),
      },
    },
    destination: {
      chain: hydration,
      asset: jito_sol,
      fee: {
        amount: 0,
        asset: jito_sol,
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
  }),
];

export const solanaConfig = new ChainRoutes({
  chain: solana,
  routes: [...toHydrationViaWormhole],
});
