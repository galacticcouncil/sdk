import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ring } from '../../assets';
import { hydration, darwinia } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ring,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ring,
      fee: {
        amount: 2,
        asset: ring,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const darwiniaConfig = new ChainRoutes({
  chain: darwinia,
  routes: [...toHydration],
});
