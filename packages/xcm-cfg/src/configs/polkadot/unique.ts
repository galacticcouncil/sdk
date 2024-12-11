import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

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
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const uniqueConfig = new ChainRoutes({
  chain: unique,
  routes: [...toHydration],
});
