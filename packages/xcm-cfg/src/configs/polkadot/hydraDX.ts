import { AssetConfig, ChainConfig } from '@galacticcouncil/xcm-core';

import {
  aca,
  astr,
  bnc,
  cfg,
  cru,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  glmr,
  hdx,
  ibtc,
  intr,
  kilt,
  nodl,
  pen,
  pha,
  pink,
  sub,
  unq,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  vdot,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
  ztg,
  ring,
  ldot,
  myth,
  vastr,
  ajun,
} from '../../assets';
import {
  acala,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  crust,
  hydraDX,
  interlay,
  polkadot,
  kilt_chain,
  moonbeam,
  nodle,
  phala,
  subsocial,
  unique,
  zeitgeist,
  ethereum,
  pendulum,
  acala_evm,
  darwinia,
  mythos,
  ajuna,
} from '../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  ExtrinsicBuilder,
  FeeBuilder,
} from '../../builders';

const toAcala: AssetConfig[] = [
  new AssetConfig({
    asset: dai_awh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 0.00092696,
      asset: dai_awh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: wbtc_awh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 0.00000004,
      asset: wbtc_awh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth_awh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 0.000000687004,
      asset: weth_awh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: aca,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 1,
      asset: aca,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: ldot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala,
    destinationFee: {
      amount: 0.06,
      asset: ldot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.07,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.7,
      asset: usdc,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: pink,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: ded,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dota,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: assetHub,
    destinationFee: {
      amount: 0.18,
      asset: usdt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiassets().X3(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: astar,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: astar,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: {
  //     asset: hdx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: vdot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: bifrost,
    destinationFee: {
      amount: 0.0000000703,
      asset: vdot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: vastr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: bifrost,
    destinationFee: {
      amount: 0.000000643,
      asset: vastr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: bifrost,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: bifrost,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: {
  //     asset: hdx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: intr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: interlay,
    destinationFee: {
      amount: 0.0019213457,
      asset: intr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: interlay,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: interlay,
    destinationFee: {
      amount: 0.5,
      asset: hdx,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: interlay,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: {
  //     asset: hdx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: moonbeam,
    destinationFee: {
      //amount: FeeBuilder().assetManager().assetTypeUnitsPerSecond(),
      amount: 0.835,
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
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
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
    asset: usdc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
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
    asset: usdt_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
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
    asset: wbtc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
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
    asset: dot,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: weth_mwh,
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
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: moonbeam,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: {
  //     asset: hdx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
  // }),
  // new AssetConfig({
  //   asset: usdc,
  //   balance: BalanceBuilder().substrate().tokens().accounts(),
  //   destination: moonbeam,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdc,
  //     balance: BalanceBuilder().substrate().tokens().accounts(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: {
  //     asset: hdx,
  //     balance: BalanceBuilder().substrate().system().account(),
  //   },
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(), //relay using x1 interior !!!
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toSubsocial: AssetConfig[] = [
  new AssetConfig({
    asset: sub,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: subsocial,
    destinationFee: {
      amount: 0.064,
      asset: sub,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
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
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.1,
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
    asset: glmr,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: {
      asset: glmr,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
  }),
];

const toPhala: AssetConfig[] = [
  new AssetConfig({
    asset: pha,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: phala,
    destinationFee: {
      amount: 0.064296,
      asset: pha,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toMythos: AssetConfig[] = [
  new AssetConfig({
    asset: myth,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: mythos,
    destinationFee: {
      amount: 0.3,
      asset: myth,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toNodle: AssetConfig[] = [
  new AssetConfig({
    asset: nodl,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: nodle,
    destinationFee: {
      amount: 0.0012,
      asset: nodl,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toUnique: AssetConfig[] = [
  new AssetConfig({
    asset: unq,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: unique,
    destinationFee: {
      amount: 0,
      asset: unq,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toCrust: AssetConfig[] = [
  new AssetConfig({
    asset: cru,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: crust,
    destinationFee: {
      amount: 0.04,
      asset: cru,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toKilt: AssetConfig[] = [
  new AssetConfig({
    asset: kilt,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: kilt_chain,
    destinationFee: {
      amount: 0.02,
      asset: kilt,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toPendulum: AssetConfig[] = [
  new AssetConfig({
    asset: pen,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: pendulum,
    destinationFee: {
      amount: 1.1,
      asset: pen,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toDarwinia: AssetConfig[] = [
  new AssetConfig({
    asset: ring,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: darwinia,
    destinationFee: {
      amount: 4,
      asset: ring,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toAjuna: AssetConfig[] = [
  new AssetConfig({
    asset: ajun,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ajuna,
    destinationFee: {
      amount: 0.001,
      asset: ajun,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
  }),
];

const toAcalaViaWormhole: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: acala_evm,
    destinationFee: {
      amount: 0.06,
      asset: aca,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.1 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenBridge().transferTokens(),
          ])
      ),
    via: moonbeam,
  }),
];

const toEthereumViaWormhole: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ethereum,
    destinationFee: {
      amount: FeeBuilder().TokenRelayer().calculateRelayerFee(),
      asset: dai_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.2 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenRelayer().transferTokensWithRelay(),
          ])
      ),
    via: moonbeam,
  }),
  new AssetConfig({
    asset: weth_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ethereum,
    destinationFee: {
      amount: FeeBuilder().TokenRelayer().calculateRelayerFee(),
      asset: weth_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.2 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenRelayer().transferTokensWithRelay(),
          ])
      ),
    via: moonbeam,
  }),
  new AssetConfig({
    asset: wbtc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ethereum,
    destinationFee: {
      amount: FeeBuilder().TokenRelayer().calculateRelayerFee(),
      asset: wbtc_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.2 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenRelayer().transferTokensWithRelay(),
          ])
      ),
    via: moonbeam,
  }),
  new AssetConfig({
    asset: usdt_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ethereum,
    destinationFee: {
      amount: FeeBuilder().TokenRelayer().calculateRelayerFee(),
      asset: usdt_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.2 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenRelayer().transferTokensWithRelay(),
          ])
      ),
    via: moonbeam,
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: BalanceBuilder().substrate().tokens().accounts(),
    destination: ethereum,
    destinationFee: {
      amount: FeeBuilder().TokenRelayer().calculateRelayerFee(),
      asset: usdc_mwh,
      balance: BalanceBuilder().substrate().tokens().accounts(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: 0.2 }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: 0.06 }),
      ]),
    fee: {
      asset: hdx,
      balance: BalanceBuilder().substrate().system().account(),
    },
    transact: ExtrinsicBuilder()
      .ethereumXcm()
      .transact(
        ContractBuilder()
          .Batch()
          .batchAll([
            ContractBuilder().Erc20().approve(),
            ContractBuilder().TokenRelayer().transferTokensWithRelay(),
          ])
      ),
    via: moonbeam,
  }),
];

export const hydraDxConfig = new ChainConfig({
  assets: [
    ...toAcala,
    ...toAcalaViaWormhole,
    ...toAjuna,
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCentrifuge,
    ...toCrust,
    ...toDarwinia,
    ...toEthereumViaWormhole,
    ...toInterlay,
    ...toKilt,
    ...toMoonbeam,
    ...toMythos,
    ...toNodle,
    ...toPhala,
    ...toPolkadot,
    ...toPendulum,
    ...toSubsocial,
    ...toUnique,
    ...toZeitgeist,
  ],
  chain: hydraDX,
});
