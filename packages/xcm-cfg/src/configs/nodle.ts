import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { nodl } from '../assets';
import { hydraDX, nodle } from '../chains';
import { ExtrinsicBuilderV2 } from 'builders';

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
      extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    }),
  ],
  chain: nodle,
});
