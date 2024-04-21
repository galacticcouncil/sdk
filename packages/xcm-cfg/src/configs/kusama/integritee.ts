import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { teer } from '../../assets';
import { basilisk, integritee } from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

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
      extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    }),
  ],
  chain: integritee,
});
