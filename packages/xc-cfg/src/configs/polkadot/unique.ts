import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import { ExtrinsicBuilder, FeeAmountBuilder } from '../../builders';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: unq,
    },
    destination: {
      chain: hydration,
      asset: unq,
      fee: {
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
