import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { astr, dot } from '../../assets';
import { astar, hydration } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: astr,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: astr,
      fee: {
        amount: 0.044306118,
        asset: astr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets().here(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: astr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const astarConfig = new ChainRoutes({
  chain: astar,
  routes: [...toHydration],
});
