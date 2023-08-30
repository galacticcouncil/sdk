import { BalanceBuilder, ExtrinsicBuilder, FeeBuilder } from '@moonbeam-network/xcm-builder';
import { AssetConfig, ChainConfig, polkadot } from '@galacticcouncil/xcm-config';

import { astr, bnc, cfg, daiAcala, daiMoonbeam, dot, glmr, hdx, ibtc, usdt, wbtc, weth, ztg } from '../assets';
import { acala, assetHub, astar, bifrost, centrifuge, hydraDX, interlay, moonbeam, zeitgeist } from '../chains';
import { ExtrinsicBuilderV3 } from '../builders';

const toAcala: AssetConfig[] = [
  new AssetConfig({
    asset: daiAcala,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 0.00092696,
      asset: daiAcala,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.7,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transferMultiasset().X3(),
  }),
];

const toAstar: AssetConfig[] = [
  new AssetConfig({
    asset: astr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: astar,
    destinationFee: {
      amount: 0.00404146544,
      asset: astr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toBifrost: AssetConfig[] = [
  new AssetConfig({
    asset: bnc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: bifrost,
    destinationFee: {
      amount: 0.000563136,
      asset: bnc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toCentrifuge: AssetConfig[] = [
  new AssetConfig({
    asset: cfg,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: centrifuge,
    destinationFee: {
      amount: 0.0092696,
      asset: cfg,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toInterlay: AssetConfig[] = [
  new AssetConfig({
    asset: ibtc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: interlay,
    destinationFee: {
      amount: 0.00000062,
      asset: ibtc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: moonbeam,
    destinationFee: {
      amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
      asset: hdx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: glmr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.01,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetConfig({
    asset: daiMoonbeam,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.04,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: wbtc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.04,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.04,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toPolkadot: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().system().account(),
    destination: polkadot,
    destinationFee: {
      amount: 0.000469417452,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

const toZeitgeist: AssetConfig[] = [
  new AssetConfig({
    asset: ztg,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.0093,
      asset: ztg,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilderV3().xTokens().transfer(),
  }),
];

export const hydraDxConfig = new ChainConfig({
  assets: [
    ...toAcala,
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCentrifuge,
    ...toInterlay,
    ...toMoonbeam,
    ...toPolkadot,
    ...toZeitgeist,
  ],
  chain: hydraDX,
});
