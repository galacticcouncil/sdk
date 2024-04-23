import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { unq } from '../assets';
import { hydraDX, unique } from '../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../builders';

export const uniqueConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: unq,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydraDX,
      destinationFee: {
        amount: 0.22,
        asset: unq,
        balance: BalanceBuilder().substrate().system().account(),
      },
      extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    }),
  ],
  chain: unique,
});
