import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: unq,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: unq,
      fee: {
        amount: 0.22,
        asset: unq,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const uniqueConfig = new ChainRoutes({
  chain: unique,
  routes: [...toHydration],
});
