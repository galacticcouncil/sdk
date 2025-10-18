import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { bsx, ksm, teer, tnkr, usdt, xrt, xon } from '../../../assets';
import {
  basilisk,
  integritee,
  karura,
  kusama,
  kusamaAssetHub,
  robonomics,
  tinkernet,
  xode,
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
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(),
  }),
];

const toKusama: AssetRoute[] = [
  // Basilisk -> Kusama: DestinationReserve with InitiateTeleport
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
      chain: kusama,
      asset: ksm,
      fee: {
        amount: 0.00012,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
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
    ...toKusama,
    ...toKusamaAssetHub,
    toTransferTemplate(bsx, karura, 0.0933),
    toTransferTemplate(teer, integritee, 0.000004),
    toTransferTemplate(xrt, robonomics, 0.00000464),
    toTransferTemplate(tnkr, tinkernet, 0.0095),
    toTransferTemplate(xon, xode, 0.0095),
  ],
});
