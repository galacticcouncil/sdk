import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { ibtc, intr, dot, hdx, usdt } from '../assets';
import { hydraDX, interlay } from '../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: intr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.136389,
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: ibtc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.00000007,
      asset: ibtc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: hdx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: hydraDX,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  //   fee: {
  //     asset: intr,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  // }),
];

export const interlayConfig = new ChainConfig({
  assets: [...toHydraDX],
  chain: interlay,
});
