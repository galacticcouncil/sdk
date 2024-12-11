import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { xrt } from '../../assets';
import { basilisk, robonomics } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: xrt,
      balance: BalanceBuilder().substrate().system().account(),
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: xrt,
      fee: {
        amount: 0.000447703,
        asset: xrt,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .limitedReserveTransferAssets(),
  }),
];

export const robonomicsConfig = new ChainRoutes({
  chain: robonomics,
  routes: [...toBasilisk],
});
