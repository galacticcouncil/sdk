import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { bsx, ksm, teer, tnkr, usdt, xrt } from '../../../assets';
import {
  basilisk,
  integritee,
  karura,
  kusama,
  kusamaAssetHub,
  robonomics,
  tinkernet,
} from '../../../chains';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

import { balance, fee } from './configs';
import { toTransferTemplate } from './templates';

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: usdt,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: kusamaAssetHub,
      asset: usdt,
      fee: {
        amount: 0.0012,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

const toKusamaAssetHub: AssetRoute[] = [
  // Basilisk -> Kusama Asset Hub: DestinationReserve with DepositAsset
  new AssetRoute({
    source: {
      asset: ksm,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: kusamaAssetHub,
      asset: ksm,
      fee: {
        amount: 0.0012,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  }),
];

export const basiliskConfig = new ChainRoutes({
  chain: basilisk,
  routes: [
    ...toAssetHub,
    ...toKusamaAssetHub,
    toTransferTemplate(bsx, karura, 0.0933),
    toTransferTemplate(teer, integritee, 0.000004),
    toTransferTemplate(xrt, robonomics, 0.00000464),
    toTransferTemplate(tnkr, tinkernet, 0.0095),
  ],
});
