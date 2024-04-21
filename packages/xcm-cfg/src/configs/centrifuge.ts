import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { cfg } from '../assets';
import { centrifuge, hydraDX } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: cfg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.006373834498834048,
      asset: cfg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  }),
];

export const centrifugeConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: centrifuge,
});
