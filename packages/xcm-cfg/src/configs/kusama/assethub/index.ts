import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm, usdt } from '../../../assets';
import {
  assetHub,
  basilisk,
  karura,
  kusama,
  kusamaAssetHub,
} from '../../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../../builders';

import { toParaStablesTemplate, extraFee } from './templates';

const toKusama = new AssetRoute({
  source: {
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      extra: extraFee,
    },
    destinationFee: {
      balance: BalanceBuilder().substrate().system().account(),
    },
  },
  destination: {
    chain: kusama,
    asset: ksm,
    fee: {
      amount: 0.0001,
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
      extra: extraFee,
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
  extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
    transferType: XcmTransferType.LocalReserve,
  }),
});

const toBasilisk = new AssetRoute({
  source: {
    asset: ksm,
    balance: BalanceBuilder().substrate().system().account(),
    fee: {
      asset: ksm,
      balance: BalanceBuilder().substrate().system().account(),
      extra: extraFee,
    },
    destinationFee: {
      balance: BalanceBuilder().substrate().system().account(),
    },
  },
  destination: {
    chain: basilisk,
    asset: ksm,
    fee: {
      amount: 0.0012,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
});

export const assetHubConfig = new ChainRoutes({
  chain: kusamaAssetHub,
  routes: [
    toKusama,
    toBasilisk,
    toPolkadotAssethub,
    toParaStablesTemplate(usdt, basilisk, 0.001),
    toParaStablesTemplate(usdt, karura, 0.001),
  ],
});
