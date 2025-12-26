import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ajun } from '../../assets';
import { hydration, ajuna } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ajun,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: ajun,
      fee: {
        amount: 0.001,
        asset: ajun,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
];

export const ajunaConfig = new ChainRoutes({
  chain: ajuna,
  routes: [...toHydration],
});
