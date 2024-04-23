import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { teer } from '../../assets';
import { basilisk, integritee } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const integriteeConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: teer,
      balance: BalanceBuilder().substrate().system().account(),
      destination: basilisk,
      destinationFee: {
        amount: 0.00275,
        asset: teer,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: integritee,
});
