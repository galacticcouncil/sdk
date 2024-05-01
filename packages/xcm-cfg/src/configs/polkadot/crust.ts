import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { cru } from '../../assets';
import { hydraDX, crust } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const crustConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: crust,
});
