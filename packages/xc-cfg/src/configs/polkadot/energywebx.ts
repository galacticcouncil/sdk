import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ewt } from '../../assets';
import { hydration, energywebx } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ewt,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ewt,
      fee: {
        amount: 0.03,
        asset: ewt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets(),
  }),
];

export const energywebxConfig = new ChainRoutes({
  chain: energywebx,
  routes: [...toHydration],
});
