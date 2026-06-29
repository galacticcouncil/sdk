import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { dot, ksm, myth, usdc, usdt, wud } from '../../../assets';
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
