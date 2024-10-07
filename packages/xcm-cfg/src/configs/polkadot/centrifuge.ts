import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { cfg } from '../../assets';
import { centrifuge, hydration } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: cfg,
      fee: {
        amount: 0.006373834498834048,
        asset: cfg,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const centrifugeConfig = new ChainRoutes({
  chain: centrifuge,
  routes: [...toHydration],
});
