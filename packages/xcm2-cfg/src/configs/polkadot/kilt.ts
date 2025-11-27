import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm2-core';

import { kilt } from '../../assets';
import { hydration, kilt_chain } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: kilt,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: kilt,
      fee: {
        amount: 0.03,
        asset: kilt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
];

export const kiltConfig = new ChainRoutes({
  chain: kilt_chain,
  routes: [...toHydration],
});
