import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { tnkr } from '../../assets';
import { basilisk, tinkernet } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const tinkernetConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: tnkr,
      balance: BalanceBuilder().substrate().system().account(),
      destination: basilisk,
      destinationFee: {
        amount: 0.01355438643,
        asset: tnkr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: tinkernet,
});
