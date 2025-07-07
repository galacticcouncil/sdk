import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  neuro,
} from '../../assets';
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
        amount: 0.044306118,
        asset: neuro,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets(),
  }),
];

export const astarConfig = new ChainRoutes({
  chain: neuroweb,
  routes: [...toHydration],
});
