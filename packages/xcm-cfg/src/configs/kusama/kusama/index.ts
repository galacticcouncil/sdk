import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { ksm } from '../../../assets';
import { basilisk, karura, kusama, kusamaAssetHub } from '../../../chains';
import { BalanceBuilder, ExtrinsicBuilder } from '../../../builders';

import { toParaTemplate, xcmDeliveryFee } from './templates';

const toAssetHub: AssetRoute = new AssetRoute({
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
    chain: kusamaAssetHub,
    asset: ksm,
    fee: {
      amount: 0.000034368318,
      asset: ksm,
    },
  },
  extrinsic: ExtrinsicBuilder().xcmPallet().limitedTeleportAssets(),
});

export const kusamaConfig = new ChainRoutes({
  chain: kusama,
  routes: [
    toAssetHub,
    toParaTemplate(basilisk, 0.00004416361),
    toParaTemplate(karura, 0.00004416361),
  ],
});
