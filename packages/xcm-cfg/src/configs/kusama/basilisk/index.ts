import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

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
import { ExtrinsicBuilder } from '../../../builders';

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

export const basiliskConfig = new ChainRoutes({
  chain: basilisk,
  routes: [
    ...toAssetHub,
    toTransferTemplate(bsx, karura, 0.0933),
    toTransferTemplate(ksm, kusama, 0.00012),
    toTransferTemplate(teer, integritee, 0.000004),
    toTransferTemplate(xrt, robonomics, 0.00000464),
    toTransferTemplate(tnkr, tinkernet, 0.0095),
  ],
});
