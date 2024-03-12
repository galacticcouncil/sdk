import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig } from '@moonbeam-network/xcm-config';

import { ksm, usdt } from '../../assets';
import { kusamaAssetHub, kusama, karura, basilisk } from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

const xcmDeliveryFeeAmount = 0.0015;

const toBasilisk: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: basilisk,
    destinationFee: {
      amount: 0.000808,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

const toKarura: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().assets().account(),
    destination: karura,
    destinationFee: {
      amount: 0.000808,
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

const toKusama: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    destination: kusama,
    destinationFee: {
      amount: 0.000090049287,
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2()
      .polkadotXcm()
      .limitedTeleportAssets(1)
      .here(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

export const assetHubConfig = new ChainConfig({
  assets: [...toBasilisk, ...toKarura, ...toKusama],
  chain: kusamaAssetHub,
});
