import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ded, dot, dota, myth, pink, usdc, usdt, wud } from '../../../assets';
import {
  assetHub,
  bifrost,
  hydration,
  moonbeam,
  mythos,
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
      min: AssetMinBuilder().assets().asset(),
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.0001,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
      chain: hydration,
      asset: usdt,
      fee: {
        amount: 0.0022,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(),
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
        amount: 0.25,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
        amount: 0.25,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  toMoonbeamExtTemplate(pink),
];

const toMythos: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      balance: BalanceBuilder().substrate().foreignAssets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: xcmDeliveryFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().foreignAssets().account(),
      },
    },
    destination: {
      chain: mythos,
      asset: myth,
      fee: {
        amount: 0.33,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(),
  }),
];

const toBifrost: AssetRoute[] = [
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

export const assetHubConfig = new ChainRoutes({
  chain: assetHub,
  routes: [
    ...toHydration,
    ...toPolkadot,
    ...toMoonbeam,
    ...toMythos,
    ...toBifrost,
  ],
});
