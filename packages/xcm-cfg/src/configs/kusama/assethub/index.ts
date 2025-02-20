import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm, usdt } from '../../../assets';
import {
  assetHub,
  basilisk,
  karura,
  kusama,
  kusamaAssetHub,
} from '../../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

import { toParaStablesTemplate, xcmDeliveryFee } from './templates';

const toKusama = new AssetRoute({
  source: {
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      extra: xcmDeliveryFee,
    },
    destinationFee: {
      balance: BalanceBuilder().substrate().system().account(),
    },
  },
  destination: {
    chain: kusama,
    asset: ksm,
    fee: {
      amount: 0.000090049287,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().polkadotXcm().limitedTeleportAssets(),
});

const toPolkadotAssethub = new AssetRoute({
  source: {
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      extra: xcmDeliveryFee,
    },
    destinationFee: {
      balance: BalanceBuilder().substrate().system().account(),
    },
  },
  destination: {
    chain: assetHub,
    asset: ksm,
    fee: {
      amount: 0.001,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
});

export const assetHubConfig = new ChainRoutes({
  chain: kusamaAssetHub,
  routes: [
    toKusama,
    toPolkadotAssethub,
    toParaStablesTemplate(usdt, basilisk, 0.000808),
    toParaStablesTemplate(usdt, karura, 0.000808),
  ],
});
