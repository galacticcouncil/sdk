import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ajun } from '../../assets';
import { hydration, ajuna } from '../../chains';
import { ExtrinsicBuilder, FeeAmountBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ajun,
    },
    destination: {
      chain: hydration,
      asset: ajun,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: ajun,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const ajunaConfig = new ChainRoutes({
  chain: ajuna,
  routes: [...toHydration],
});
