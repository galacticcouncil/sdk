import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { pha } from '../assets';
import { hydraDX, phala } from '../chains';
import { ExtrinsicBuilderV2 } from 'builders';

export const phalaConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: pha,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.01842508453,
        asset: pha,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilderV2().xTransfer().transfer().here(),
    }),
  ],
  chain: phala,
});
