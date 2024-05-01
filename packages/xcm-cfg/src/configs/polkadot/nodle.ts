import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { nodl } from '../../assets';
import { hydraDX, nodle } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const nodleConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: nodl,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.2,
        asset: nodl,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: nodle,
});
