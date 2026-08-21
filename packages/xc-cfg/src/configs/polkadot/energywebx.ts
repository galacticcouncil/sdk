import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ewt } from '../../assets';
import { hydration, energywebx } from '../../chains';
import { ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ewt,
      fee: {
        asset: ewt,
        extra: 0.030555,
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
