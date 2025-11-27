import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { cfg, dot, glmr } from '../../assets';
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
  new AssetRoute({
    source: {
      asset: glmr,
      balance: BalanceBuilder().substrate().ormlTokens().accounts(),
      fee: {
        asset: cfg,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().ormlTokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: glmr,
      fee: {
        amount: 0.05,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const centrifugeConfig = new ChainRoutes({
  chain: centrifuge,
  routes: [...toHydration],
});
