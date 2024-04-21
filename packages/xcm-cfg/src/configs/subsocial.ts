import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { sub } from '../assets';
import { hydraDX, subsocial } from '../chains';
import { ExtrinsicBuilderV2 } from 'builders';

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
    extrinsic: ExtrinsicBuilderV2()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .here(),
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
