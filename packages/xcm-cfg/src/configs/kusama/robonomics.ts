import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { xrt } from '../../assets';
import { basilisk, robonomics } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const robonomicsConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: xrt,
      balance: BalanceBuilder().substrate().system().account(),
      destination: basilisk,
      destinationFee: {
        amount: 0.000447703,
        asset: xrt,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder()
        .polkadotXcm()
        .limitedReserveTransferAssets()
        .X1(),
    }),
  ],
  chain: robonomics,
});
