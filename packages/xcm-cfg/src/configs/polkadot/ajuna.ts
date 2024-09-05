import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { ajun } from '../../assets';
import { hydration, ajuna } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: ajun,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.001,
      asset: ajun,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const ajunaConfig = new ChainConfig({
  assets: [...toHydration],
  chain: ajuna,
});
