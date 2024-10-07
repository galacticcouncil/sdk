import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { nodl } from '../../assets';
import { hydration, nodle } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: nodl,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: nodl,
      fee: {
        amount: 0.2,
        asset: nodl,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const nodleConfig = new ChainRoutes({
  chain: nodle,
  routes: [...toHydration],
});
