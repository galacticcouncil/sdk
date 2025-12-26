import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
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
        amount: 0.22,
        asset: unq,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
];

export const uniqueConfig = new ChainRoutes({
  chain: unique,
  routes: [...toHydration],
});
