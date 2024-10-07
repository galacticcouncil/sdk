import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ajun } from '../../assets';
import { hydration, ajuna } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ajun,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ajun,
      fee: {
        amount: 0.001,
        asset: ajun,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const ajunaConfig = new ChainRoutes({
  chain: ajuna,
  routes: [...toHydration],
});
