import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { tnkr } from '../../assets';
import { basilisk, tinkernet } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

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
        amount: 0.01355438643,
        asset: tnkr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const tinkernetConfig = new ChainRoutes({
  chain: tinkernet,
  routes: [...toBasilisk],
});
