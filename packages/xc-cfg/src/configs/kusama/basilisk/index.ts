import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { ksm, usdt } from '../../../assets';
import {
  basilisk,
  kusamaAssetHub,
} from '../../../chains';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

import { balance, fee } from './configs';

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
  ],
});
