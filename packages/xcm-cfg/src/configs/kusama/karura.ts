import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { bsx, kar, ksm, usdt } from '../../assets';
import { basilisk, karura, kusama, kusamaAssetHub } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilderV4 } from '../../builders';

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: kar,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: kusamaAssetHub,
      asset: usdt,
      fee: {
        amount: 0.001183,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transferMultiasset(),
  }),
];

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: bsx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: kar,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: basilisk,
      asset: bsx,
      fee: {
        amount: 22,
        asset: bsx,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toKusama: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().tokens().accounts(),
      fee: {
        asset: kar,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().tokens().accounts(),
      },
    },
    destination: {
      chain: kusama,
      asset: ksm,
      fee: {
        amount: 22,
        asset: bsx,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const karuraConfig = new ChainRoutes({
  chain: karura,
  routes: [...toAssetHub, ...toBasilisk, ...toKusama],
});
