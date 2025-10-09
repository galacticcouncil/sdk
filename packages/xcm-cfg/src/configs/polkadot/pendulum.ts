import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { eurc, pen, xlm } from '../../assets';
import { hydration, pendulum } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pen,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: pen,
      fee: {
        amount: 0.2,
        asset: pen,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: eurc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: eurc,
      fee: {
        amount: 0.0008,
        asset: eurc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),

  new AssetRoute({
    source: {
      asset: xlm,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: hydration,
      asset: xlm,
      fee: {
        amount: 0.09,
        asset: xlm,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const pendulumConfig = new ChainRoutes({
  chain: pendulum,
  routes: [...toHydration],
});
