import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { xon } from '../../assets';
import { basilisk, xode } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: xon,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: xon,
      fee: {
        amount: 0.014,
        asset: xon,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const xodeConfig = new ChainRoutes({
  chain: xode,
  routes: [...toBasilisk],
});
