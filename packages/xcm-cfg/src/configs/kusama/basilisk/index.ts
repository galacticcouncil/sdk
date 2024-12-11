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
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
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
