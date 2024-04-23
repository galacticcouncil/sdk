import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { bsx, kar, ksm, usdt } from '../../assets';
import { basilisk, karura, kusama, kusamaAssetHub } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: kusamaAssetHub,
    destinationFee: {
      amount: 0.001183,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
    fee: {
      asset: kar,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toBasilisk: AssetConfig[] = [
  new AssetConfig({
    asset: bsx,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: basilisk,
    destinationFee: {
      amount: 22,
      asset: bsx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: kar,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toKusama: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: kusama,
    destinationFee: {
      amount: 0.000079999999,
      asset: ksm,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: kar,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const karuraConfig = new ChainConfig({
  assets: [...toAssetHub, ...toBasilisk, ...toKusama],
  chain: karura,
});
