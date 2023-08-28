import { BalanceBuilder, ExtrinsicBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig, polkadot } from '@galacticcouncil/xcm-config';

import { dot } from '../assets';
import { hydraDX } from '../chains';

export const polkadotConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.002172,
        asset: dot,
      },
      extrinsic: ExtrinsicBuilder().xcmPallet().limitedReserveTransferAssets(0).here(),
    }),
  ],
  chain: polkadot,
});
