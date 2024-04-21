import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import { BalanceBuilder } from '@moonbeam-network/xcm-builder';

import { usdc_mwh, ztg, glmr } from '../assets';
import { hydraDX, zeitgeist } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: ztg,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.0225,
      asset: ztg,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiCurrencies(),
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
  new AssetConfig({
    asset: glmr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiCurrencies(),
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
];

export const zeitgeistConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: zeitgeist,
});
