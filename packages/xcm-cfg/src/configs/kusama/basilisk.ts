import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';
import {
  BalanceBuilder,
  ExtrinsicBuilder,
} from '@moonbeam-network/xcm-builder';

import { bsx, ksm, teer, tnkr, usdt, xrt } from '../../assets';
import {
  basilisk,
  integritee,
  karura,
  kusama,
  kusamaAssetHub,
  robonomics,
  tinkernet,
} from '../../chains';
import { ExtrinsicBuilderV2 } from '../../builders';

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: kusamaAssetHub,
    destinationFee: {
      amount: 0.001183,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiasset().X3(),
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toKarura: AssetConfig[] = [
  new AssetConfig({
    asset: bsx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: karura,
    destinationFee: {
      amount: 0.09324,
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Configure Karura <-> Basilisk (KSM)
  // new AssetConfig({
  //   asset: ksm,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: karura,
  //   destinationFee: {
  //     amount: 0.000090741527,
  //     asset: ksm,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  //   fee: {
  //     asset: bsx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
];

const toKusama: AssetConfig[] = [
  new AssetConfig({
    asset: ksm,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: kusama,
    destinationFee: {
      amount: 0.00010457164,
      asset: ksm,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(), //relay using x1 interior !!!
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toIntegritee: AssetConfig[] = [
  new AssetConfig({
    asset: teer,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: integritee,
    destinationFee: {
      amount: 0.000004,
      asset: teer,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toRobonomics: AssetConfig[] = [
  new AssetConfig({
    asset: xrt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: robonomics,
    destinationFee: {
      amount: 0.000004632,
      asset: xrt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toTinkernet: AssetConfig[] = [
  new AssetConfig({
    asset: tnkr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: tinkernet,
    destinationFee: {
      amount: 0.00927020324,
      asset: tnkr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bsx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const basiliskConfig = new ChainConfig({
  assets: [
    ...toAssetHub,
    ...toKarura,
    ...toKusama,
    ...toIntegritee,
    ...toRobonomics,
    ...toTinkernet,
  ],
  chain: basilisk,
});
