import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { neuro } from '../../assets';
import { neuroweb, hydration } from '../../chains';
import { ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: neuro,
    },
    destination: {
      chain: hydration,
      asset: neuro,
      fee: {
        amount: 0.205,
        asset: neuro,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets(),
  }),
];

export const neurowebConfig = new ChainRoutes({
  chain: neuroweb,
  routes: [...toHydration],
});
