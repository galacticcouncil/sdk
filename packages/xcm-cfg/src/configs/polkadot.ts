import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig, polkadot } from '@moonbeam-network/xcm-config';

import { dot } from '../assets';
import { hydraDX } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.002172,
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV3().xcmPallet().limitedReserveTransferAssets().here(),
  }),
];

export const polkadotConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: polkadot,
});
