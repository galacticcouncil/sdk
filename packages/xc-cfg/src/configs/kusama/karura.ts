import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { bsx, kar, ksm, usdt } from '../../assets';
import { basilisk, karura, kusama, kusamaAssetHub } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

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
        amount: 0.0012,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

export const karuraConfig = new ChainRoutes({
  chain: karura,
  routes: [...toAssetHub, ...toBasilisk],
});
