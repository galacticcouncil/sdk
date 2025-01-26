import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm } from '../../assets';
import { kusama, kusamaAssetHub, basilisk, karura } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const toBasilisk: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: basilisk,
      asset: ksm,
      fee: {
        amount: 0.000072711796,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedReserveTransferAssets(),
  }),
];

const toKarura: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: karura,
      asset: ksm,
      fee: {
        amount: 0.00004416361,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedReserveTransferAssets(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: ksm,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: kusamaAssetHub,
      asset: ksm,
      fee: {
        amount: 0.000034368318,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(),
  }),
];

export const kusamaConfig = new ChainRoutes({
  chain: kusama,
  routes: [...toBasilisk, ...toAssetHub, ...toKarura],
});
