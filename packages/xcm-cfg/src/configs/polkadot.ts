import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import {
  AssetConfig,
  ChainConfig,
  polkadot,
} from '@moonbeam-network/xcm-config';

import { dot } from '../assets';
import { bifrost, hydraDX } from '../chains';

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
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
  }),
];

const toBifrost: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().system().account(),
    destination: bifrost,
    destinationFee: {
      amount: 0.002172,
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
  }),
];

export const polkadotConfig = new ChainConfig({
  assets: [
    ...toHydraDX,
    ...toBifrost,
  ],
  chain: polkadot,
});
