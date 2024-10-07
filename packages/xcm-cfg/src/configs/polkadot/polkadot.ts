import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { dot } from '../../assets';
import { assetHub, bifrost, hydration, polkadot } from '../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../builders';

const xcmDeliveryFee = 0.047;

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.002172,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
  }),
];

const toBifrost: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: bifrost,
      asset: dot,
      fee: {
        amount: 0.001,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .xcmPallet()
      .limitedReserveTransferAssets(0)
      .here(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().system().account(),
      },
    },
    destination: {
      chain: assetHub,
      asset: dot,
      fee: {
        amount: 0.00014,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(0).here(),
  }),
];

export const polkadotConfig = new ChainRoutes({
  chain: polkadot,
  routes: [...toHydration, ...toBifrost, ...toAssetHub],
});
