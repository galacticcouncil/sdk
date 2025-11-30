import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { tnkr } from '../../assets';
import { basilisk, tinkernet } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: tnkr,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: tnkr,
      fee: {
        amount: 0.014,
        asset: tnkr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const tinkernetConfig = new ChainRoutes({
  chain: tinkernet,
  routes: [...toBasilisk],
});
