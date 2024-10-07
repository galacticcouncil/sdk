import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ded, dot, dota, pink, usdc, usdt, wud } from '../../../assets';
import {
  assetHub,
  bifrost,
  hydration,
  moonbeam,
  polkadot,
} from '../../../chains';
import {
  AssetMinBuilder,
  BalanceBuilder,
  ExtrinsicBuilder,
} from '../../../builders';

import {
  toHydrationExtTemplate,
  toMoonbeamExtTemplate,
  xcmDeliveryFee,
} from './templates';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: hydration,
      asset: usdt,
      fee: {
        amount: 0.0022,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: hydration,
      asset: usdc,
      fee: {
        amount: 0.02,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  toHydrationExtTemplate(pink),
  toHydrationExtTemplate(ded),
  toHydrationExtTemplate(dota),
  toHydrationExtTemplate(wud),
];

const toPolkadot: AssetRoute[] = [
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
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: polkadot,
      asset: dot,
      fee: {
        amount: 0.003,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(1).here(),
  }),
];

const toMoonbeam: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: moonbeam,
      asset: usdt,
      fee: {
        amount: 0.02,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: moonbeam,
      asset: usdc,
      fee: {
        amount: 0.03,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  toMoonbeamExtTemplate(pink),
];

const toBifrost: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pink,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: bifrost,
      asset: pink,
      fee: {
        amount: 0.0001,
        asset: pink,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  new AssetRoute({
    source: {
      asset: usdt,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: bifrost,
      asset: usdt,
      fee: {
        amount: 0.03,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: BalanceBuilder().substrate().assets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().assets().account(),
      },
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: bifrost,
      asset: usdc,
      fee: {
        amount: 0.03,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .polkadotXcm()
      .limitedReserveTransferAssets()
      .X2(),
  }),
];

export const assetHubConfig = new ChainRoutes({
  chain: assetHub,
  routes: [...toHydration, ...toPolkadot, ...toMoonbeam, ...toBifrost],
});
