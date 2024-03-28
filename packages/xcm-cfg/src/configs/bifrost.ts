import { BalanceBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig, polkadot, usdc } from '@moonbeam-network/xcm-config';

import { bnc, vdot, dot, usdt, hdx, pink } from '../assets';
import { assetHub, bifrost, hydraDX } from '../chains';
import { ExtrinsicBuilderV2 } from '../builders';

const toHydraDX: AssetConfig[] = [
  new AssetConfig({
    asset: bnc,
    balance: BalanceBuilder().substrate().system().account(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.014645,
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: vdot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.000555,
      asset: vdot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: hydraDX,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: hydraDX,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
  //   fee: {
  //     asset: bnc,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   }
  // }),
];

const toPolkadot: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: polkadot,
    destinationFee: {
      amount: 0.003,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transfer(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiassets().X3(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.11,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiassets().X3(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.11,
      asset: usdc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV2().xTokens().transferMultiassets().X3(),
    fee: {
      asset: bnc,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

export const bifrostConfig = new ChainConfig({
  assets: [
    ...toHydraDX,
    ...toPolkadot,
    ...toAssetHub,
  ],
  chain: bifrost,
});
