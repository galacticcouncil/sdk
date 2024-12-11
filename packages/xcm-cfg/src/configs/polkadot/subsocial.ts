import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { sub } from '../../assets';
import { hydration, subsocial } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: sub,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: sub,
      fee: {
        amount: 0.0003525641,
        asset: sub,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const subsocialConfig = new ChainRoutes({
  chain: subsocial,
  routes: [...toHydration],
});
