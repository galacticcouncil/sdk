import { AssetMinBuilder, BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { sub } from '../assets';
import { hydraDX, subsocial } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: sub,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.0003525641,
      asset: sub,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV3()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
    fee: {
      asset: sub,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const subsocialConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: subsocial,
});
