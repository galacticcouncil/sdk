import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { cru } from '../../assets';
import { hydration, crust } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: cru,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.01,
      asset: cru,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const crustConfig = new ChainConfig({
  assets: [...toHydration],
  chain: crust,
});
