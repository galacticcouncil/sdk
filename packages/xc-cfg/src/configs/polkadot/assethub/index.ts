import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { dot, hollar, ksm, myth, usdc, usdt, wud } from '../../../assets';
import {
  assetHub,
  assetHubCex,
  bifrost,
  hydration,
  kusamaAssetHub,
  moonbeam,
  mythos,
} from '../../../chains';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

import {
  extraFee,
  toParaStablesTemplate,
  toHydrationExtTemplate,
  toParaReservesWithSwapTemplate,
} from './templates';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.001,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
  new AssetRoute({
    source: {
      asset: ksm,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: hydration,
      asset: ksm,
      fee: {
        amount: 0.0001,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
    }),
  }),
  toParaStablesTemplate(usdt, hydration, 0.02),
  toParaStablesTemplate(usdc, hydration, 0.02),
  toHydrationExtTemplate(wud),
  // HOLLAR is a foreign asset with Hydration as its reserve chain - the
  // transfer burns the hub derivative and withdraws from AssetHub's
  // sovereign account on Hydration.
  new AssetRoute({
    source: {
      asset: hollar,
      balance: BalanceBuilder().substrate().foreignAssets().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: extraFee,
      },
      destinationFee: {
        balance: BalanceBuilder().substrate().foreignAssets().account(),
      },
    },
    destination: {
      chain: hydration,
      asset: hollar,
      fee: {
        amount: 0.02,
        asset: hollar,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  }),
];

const toKusamaAssethub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: kusamaAssetHub,
      asset: ksm,
      fee: {
        amount: 0.001,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssets(),
  }),
];

const toMoonbeam: AssetRoute[] = [
  toParaStablesTemplate(usdt, moonbeam, 0.25),
  toParaStablesTemplate(usdc, moonbeam, 0.25),
];

const toBifrost: AssetRoute[] = [
  toParaStablesTemplate(usdt, bifrost, 0.03),
  toParaStablesTemplate(usdc, bifrost, 0.03),
];

const toMythos: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      fee: {
        asset: dot,
        extra: extraFee,
      },
    },
    destination: {
      chain: mythos,
      asset: myth,
      fee: {
        amount: 2.5,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(),
  }),
];

export const assetHubCexConfig = new ChainRoutes({
  chain: assetHubCex,
  routes: [
    toParaReservesWithSwapTemplate(usdt, hydration, 0.02),
    toParaReservesWithSwapTemplate(usdc, hydration, 0.02),
    toParaReservesWithSwapTemplate(dot, hydration, 0.001),
  ],
});

export const assetHubConfig = new ChainRoutes({
  chain: assetHub,
  routes: [
    ...toHydration,
    ...toKusamaAssethub,
    ...toMoonbeam,
    ...toBifrost,
    ...toMythos,
  ],
});
