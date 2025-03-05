import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { dot } from '../../../assets';
import {
  assetHub,
  bifrost,
  hydration,
  polkadot,
  polkadotCex,
} from '../../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

import { toParaTemplate, xcmDeliveryFee } from './templates';

const toAssetHub = new AssetRoute({
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
  extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(),
});

export const polkadotConfig = new ChainRoutes({
  chain: polkadot,
  routes: [
    toAssetHub,
    toParaTemplate(hydration, 0.002172),
    toParaTemplate(bifrost, 0.001),
  ],
});

export const polkadotCexConfig = new ChainRoutes({
  chain: polkadotCex,
  routes: [toParaTemplate(hydration, 0.002172)],
});
