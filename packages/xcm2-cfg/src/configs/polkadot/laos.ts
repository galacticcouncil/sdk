import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { laos } from '../../assets';
import { hydration, laos_chain } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: laos,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: laos,
      fee: {
        amount: 2,
        asset: laos,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
];

export const laosConfig = new ChainRoutes({
  chain: laos_chain,
  routes: [...toHydration],
});
