import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { dot, ksm } from '../../../assets';
import { assetHub, basilisk, hydration, kusamaAssetHub } from '../../../chains';
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

// Direct routes via the Polkadot<>Kusama bridge with an onward hop
// executed on the peer AssetHub gateway (single signature).
const toHydration: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ksm,
      fee: {
        asset: ksm,
        extra: extraFee,
      },
    },
    destination: {
      chain: hydration,
      asset: ksm,
      fee: {
        amount: 0.04,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.LocalReserve,
      executionFee: 0.005,
    }),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      fee: {
        asset: ksm,
        extra: extraFee,
      },
    },
    destination: {
      chain: hydration,
      asset: dot,
      fee: {
        amount: 0.15,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
      executionFee: 0.01,
    }),
  }),
];

export const assetHubConfig = new ChainRoutes({
  chain: kusamaAssetHub,
  routes: [toBasilisk, toPolkadotAssethub, ...toHydration],
});
