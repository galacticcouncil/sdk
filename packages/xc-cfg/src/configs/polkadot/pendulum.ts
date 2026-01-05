import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { pen } from '../../assets';
import { hydration, pendulum } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

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
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: pen,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const pendulumConfig = new ChainRoutes({
  chain: pendulum,
  routes: [...toHydration],
});
