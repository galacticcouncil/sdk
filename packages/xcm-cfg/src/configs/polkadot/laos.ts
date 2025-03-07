import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { laos } from '../../assets';
import { hydration, laos_chain } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: laos,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: laos,
      fee: {
        amount: 2,
        asset: laos,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const laosConfig = new ChainRoutes({
  chain: laos_chain,
  routes: [...toHydration],
});
