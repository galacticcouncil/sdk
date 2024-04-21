import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { unq } from '../assets';
import { hydraDX, unique } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

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
      extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    }),
  ],
  chain: unique,
});
