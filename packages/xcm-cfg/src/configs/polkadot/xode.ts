import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { xon } from '../../assets';
import { hydration, xode } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: xon,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: xon,
      fee: {
        amount: 0.01,
        asset: xon,
      },
    },
    extrinsic: ExtrinsicBuilder().xTransfer().transfer(),
  }),
];

export const xodeConfig = new ChainRoutes({
  chain: xode,
  routes: [...toHydration],
});
