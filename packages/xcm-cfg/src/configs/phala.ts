import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { pha } from '../assets';
import { hydraDX, phala } from '../chains';
import { BalanceBuilder, ExtrinsicBuilder } from 'builders';

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
      extrinsic: ExtrinsicBuilder().xTransfer().transfer().here(),
    }),
  ],
  chain: phala,
});
