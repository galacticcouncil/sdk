import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import { ksm } from '../../assets';
import { kusama, kusamaAssetHub, basilisk, karura } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const xcmDeliveryFeeAmount = 0.002;

const toBasilisk: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    destination: basilisk,
    destinationFee: {
      amount: 0.000072711796,
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

const toKarura: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    destination: karura,
    destinationFee: {
      amount: 0.00004416361,
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    destination: kusamaAssetHub,
    destinationFee: {
      amount: 0.000034368318,
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(0).here(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      xcmDeliveryFeeAmount,
    },
  }),
];

export const kusamaConfig = new ChainConfig({
  assets: [...toBasilisk, ...toAssetHub, ...toKarura],
  chain: kusama,
});
