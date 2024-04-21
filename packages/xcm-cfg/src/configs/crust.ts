import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { cru } from '../assets';
import { hydraDX, crust } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: cru,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.01,
      asset: cru,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  }),
];

export const crustConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: crust,
});
