import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { usdc_mwh, ztg, glmr } from '../../assets';
import { hydration, zeitgeist } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toHydration: AssetConfig[] = [
  new AssetConfig({
    asset: ztg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydration,
    destinationFee: {
      amount: 0.0225,
      asset: ztg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: glmr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydration,
    destinationFee: {
      amount: 0.0035,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydration,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
];

export const zeitgeistConfig = new ChainConfig({
  assets: [...toHydration],
  chain: zeitgeist,
});
