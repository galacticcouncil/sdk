import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { cru } from '../../assets';
import { hydration, crust } from '../../chains';
import { ExtrinsicBuilder, FeeAmountBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cru,
    },
    destination: {
      chain: hydration,
      asset: cru,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
        asset: cru,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().reserveTransferAssets(),
  }),
];

export const crustConfig = new ChainRoutes({
  chain: crust,
  routes: [...toHydration],
});
