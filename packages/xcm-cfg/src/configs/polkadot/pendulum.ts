import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { pen } from '../../assets';
import { hydration, pendulum } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pen,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: pen,
      fee: {
        amount: 0.2,
        asset: pen,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const pendulumConfig = new ChainRoutes({
  chain: pendulum,
  routes: [...toHydration],
});
