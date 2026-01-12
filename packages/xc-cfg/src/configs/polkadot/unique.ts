import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  FeeAmountBuilder,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: unq,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: unq,
      fee: {
        amount: FeeAmountBuilder().PolkadotXcm().calculateLimitedReserveTransferFee(),
        asset: unq,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const uniqueConfig = new ChainRoutes({
  chain: unique,
  routes: [...toHydration],
});
