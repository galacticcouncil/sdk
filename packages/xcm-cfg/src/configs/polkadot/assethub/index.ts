import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ded, dot, dota, myth, pink, usdc, usdt, wud } from '../../../assets';
import {
  assetHub,
  assetHubCex,
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
  toParaStablesTemplate,
  toParaStablesWithSwapTemplate,
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

export const assetHubConfig = new ChainRoutes({
  chain: assetHub,
  routes: [
    ...toHydration,
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
