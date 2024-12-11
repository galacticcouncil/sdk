import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { teer } from '../../assets';
import { basilisk, integritee } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: teer,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: teer,
      fee: {
        amount: 0.00275,
        asset: teer,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const integriteeConfig = new ChainRoutes({
  chain: integritee,
  routes: [...toBasilisk],
});
