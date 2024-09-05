import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { pha } from '../../assets';
import { hydration, phala } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const phalaConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: pha,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydration,
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
