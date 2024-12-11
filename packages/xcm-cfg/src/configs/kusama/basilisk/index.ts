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
import { ExtrinsicBuilderV4 } from '../../../builders';

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
        amount: 0.001183,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transferMultiasset(),
  }),
];

const toKarura: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: bsx,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: karura,
      asset: bsx,
      fee: {
        amount: 0.09324,
        asset: bsx,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toKusama: AssetRoute[] = [
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
        amount: 0.00010457164,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toIntegritee: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: teer,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: integritee,
      asset: teer,
      fee: {
        amount: 0.000004,
        asset: teer,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toRobonomics: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: xrt,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: robonomics,
      asset: xrt,
      fee: {
        amount: 0.000004632,
        asset: xrt,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

const toTinkernet: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: tnkr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: tinkernet,
      asset: tnkr,
      fee: {
        amount: 0.00927020324,
        asset: tnkr,
      },
    },
    extrinsic: ExtrinsicBuilderV4().xTokens().transfer(),
  }),
];

export const basiliskConfig = new ChainRoutes({
  chain: basilisk,
  routes: [
    ...toAssetHub,
    ...toKarura,
    ...toKusama,
    ...toIntegritee,
    ...toRobonomics,
    ...toTinkernet,
  ],
});
