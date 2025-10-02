import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm } from '../../../assets';
import { basilisk, kusama, kusamaAssetHub } from '../../../chains';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
  XcmTransferType,
} from '../../../builders';

import { extraFee } from './templates';

const toAssetHub: AssetRoute = new AssetRoute({
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
    chain: kusamaAssetHub,
    asset: ksm,
    fee: {
      amount: 0.0002,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(),
});

const toBasilisk: AssetRoute = new AssetRoute({
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
      amount: 0.00012,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().xcmPallet().transferAssetsUsingTypeAndThen({
    transferType: XcmTransferType.LocalReserve,
  }),
});

export const kusamaConfig = new ChainRoutes({
  chain: kusama,
  routes: [toAssetHub, toBasilisk],
});
