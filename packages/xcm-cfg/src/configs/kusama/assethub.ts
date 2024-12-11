import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm, usdt } from '../../assets';
import { kusamaAssetHub, kusama, karura, basilisk } from '../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  ExtrinsicBuilderV4,
} from '../../builders';

const xcmDeliveryFee = 0.0015;

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: usdt,
      fee: {
        amount: 0.000808,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .limitedReserveTransferAssets(),
  }),
];

const toKarura: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
    },
    destination: {
      chain: karura,
      asset: usdt,
      fee: {
        amount: 0.000808,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .limitedReserveTransferAssets(),
  }),
];

const toKusama: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: kusama,
      asset: ksm,
      fee: {
        amount: 0.000090049287,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilderV4().polkadotXcm().limitedTeleportAssets(),
  }),
];

export const assetHubConfig = new ChainRoutes({
  chain: kusamaAssetHub,
  routes: [...toBasilisk, ...toKarura, ...toKusama],
});
