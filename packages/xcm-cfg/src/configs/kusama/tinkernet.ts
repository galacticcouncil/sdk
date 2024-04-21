import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { tnkr } from '../../assets';
import { basilisk, tinkernet } from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

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
      extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    }),
  ],
  chain: tinkernet,
});
