import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ksm } from '../../../assets';
import { assetHub, basilisk, kusamaAssetHub } from '../../../chains';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

import { extraFee } from './templates';

const toPolkadotAssethub = new AssetRoute({
  source: {
    asset: ksm,
    fee: {
      asset: ksm,
      extra: extraFee,
    },
  },
  destination: {
    chain: assetHub,
    asset: ksm,
    fee: {
      amount: 0.002,
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
    fee: {
      asset: ksm,
      extra: extraFee,
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
  routes: [toBasilisk, toPolkadotAssethub],
});
