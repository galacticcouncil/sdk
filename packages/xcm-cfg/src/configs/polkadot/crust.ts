import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { cru } from '../../assets';
import { hydration, crust } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cru,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: cru,
      fee: {
        amount: 0.01,
        asset: cru,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const crustConfig = new ChainRoutes({
  chain: crust,
  routes: [...toHydration],
});
