import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { cfg } from '../../assets';
import { centrifuge, hydration } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: cfg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.006373834498834048,
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const centrifugeConfig = new ChainConfig({
  assets: [...toHydration],
  chain: centrifuge,
});
