import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ring } from '../../assets';
import { hydration, darwinia } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ring,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ring,
      fee: {
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: ring,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const darwiniaConfig = new ChainRoutes({
  chain: darwinia,
  routes: [...toHydration],
});
