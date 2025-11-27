import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { pha } from '../../assets';
import { hydration, phala } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pha,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: pha,
      fee: {
        amount: 0.01842508453,
        asset: pha,
      },
    },
    extrinsic: ExtrinsicBuilder().xTransfer().transfer(),
  }),
];

export const phalaConfig = new ChainRoutes({
  chain: phala,
  routes: [...toHydration],
});
