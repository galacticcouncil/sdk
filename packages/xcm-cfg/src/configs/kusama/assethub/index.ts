import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm } from '../../../assets';
import { assetHub, basilisk, kusama, kusamaAssetHub } from '../../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../../builders';

import { extraFee } from './templates';

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
      amount: 0.06,
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
  extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
    transferType: XcmTransferType.LocalReserve,
  }),
});

export const assetHubConfig = new ChainRoutes({
  chain: kusamaAssetHub,
  routes: [toKusama, toBasilisk, toPolkadotAssethub],
});
