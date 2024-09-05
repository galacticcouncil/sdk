import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { unq } from '../../assets';
import { hydration, unique } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

export const uniqueConfig = new ChainConfig({
  assets: [
    new AssetConfig({
      asset: unq,
      balance: BalanceBuilder().substrate().system().account(),
      destination: hydration,
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
