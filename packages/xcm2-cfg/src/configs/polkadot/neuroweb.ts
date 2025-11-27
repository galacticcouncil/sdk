import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { neuro } from '../../assets';
import { neuroweb, hydration } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: neuro,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
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
