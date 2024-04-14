import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { xrt } from '../../assets';
import { basilisk, robonomics } from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

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
      extrinsic: ExtrinsicBuilderV2()
        .polkadotXcm()
        .limitedReserveTransferAssets()
        .X1(),
    }),
  ],
  chain: robonomics,
});
