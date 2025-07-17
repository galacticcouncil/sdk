import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  aave,
  ded,
  dot,
  dota,
  eth,
  ksm,
  ldo,
  link,
  myth,
  pink,
  sky,
  tbtc,
  usdc,
  usdc_eth,
  usdt,
  usdt_eth,
  wud,
} from '../../../assets';
import {
  assetHub,
  assetHubCex,
  bifrost,
  hydration,
  kusamaAssetHub,
  moonbeam,
  mythos,
  polkadot,
} from '../../../chains';
import {
  AssetMinBuilder,
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../../builders';

import {
  toParaStablesTemplate,
  toParaStablesWithSwapTemplate,
  toHydrationExtTemplate,
  toMoonbeamExtTemplate,
  toHydrationForeignAssetTemplate,
  extraFee,
} from './templates';

const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: BalanceBuilder().substrate().system().account(),
      fee: {
        asset: dot,
        balance: BalanceBuilder().substrate().system().account(),
        extra: extraFee,
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
  toHydrationForeignAssetTemplate(ksm, XcmTransferType.LocalReserve, 0.0001),
  toHydrationForeignAssetTemplate(eth, XcmTransferType.DestinationReserve, 0.0000055),
  toHydrationForeignAssetTemplate(usdc_eth, XcmTransferType.DestinationReserve, 0.01),
  toHydrationForeignAssetTemplate(usdt_eth, XcmTransferType.DestinationReserve, 0.01),
  toHydrationForeignAssetTemplate(tbtc, XcmTransferType.DestinationReserve, 0.00000023),
  toHydrationForeignAssetTemplate(aave, XcmTransferType.DestinationReserve, 0.00006),
  toHydrationForeignAssetTemplate(link, XcmTransferType.DestinationReserve, 0.001),
  toHydrationForeignAssetTemplate(sky, XcmTransferType.DestinationReserve, 0.52),
  toHydrationForeignAssetTemplate(ldo, XcmTransferType.DestinationReserve, 0.013),
  toParaStablesTemplate(usdt, hydration, 0.02),
  toParaStablesTemplate(usdc, hydration, 0.02),
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
        extra: extraFee,
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

const toKusamaAssethub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
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
  toMoonbeamExtTemplate(pink),
];

const toBifrost: AssetRoute[] = [
  toParaStablesTemplate(usdt, bifrost, 0.03),
  toParaStablesTemplate(usdc, bifrost, 0.03),
];

const toMythos: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
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

export const assetHubConfig = new ChainRoutes({
  chain: assetHub,
  routes: [
    ...toHydration,
    ...toKusamaAssethub,
    ...toPolkadot,
    ...toMoonbeam,
    ...toBifrost,
    ...toMythos,
  ],
});

export const assetHubCexConfig = new ChainRoutes({
  chain: assetHubCex,
  routes: [
    toParaStablesWithSwapTemplate(usdt, hydration, 0.02),
    toParaStablesWithSwapTemplate(usdc, hydration, 0.02),
  ],
});
