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
  wud,
} from '../../../assets';
import {
  acala,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  crust,
  hydration,
  interlay,
  polkadot,
  kilt_chain,
  moonbeam,
  nodle,
  phala,
  subsocial,
  unique,
  zeitgeist,
  pendulum,
  acala_evm,
  darwinia,
  mythos,
  ajuna,
} from '../../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  ExtrinsicBuilder,
} from '../../../builders';

import { balance, fee } from './configs';
import {
  MRL_EXECUTION_FEE,
  MRL_XCM_FEE,
  toAssethubExtTemplate,
  toEthereumWithRelayerTemplate,
} from './templates';

const toAcala: AssetConfig[] = [
  new AssetConfig({
    asset: dai_awh,
    balance: balance(),
    destination: acala,
    destinationFee: {
      amount: 0.00092696,
      asset: dai_awh,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: wbtc_awh,
    balance: balance(),
    destination: acala,
    destinationFee: {
      amount: 0.00000004,
      asset: wbtc_awh,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: weth_awh,
    balance: balance(),
    destination: acala,
    destinationFee: {
      amount: 0.000000687004,
      asset: weth_awh,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: aca,
    balance: balance(),
    destination: acala,
    destinationFee: {
      amount: 1,
      asset: aca,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: ldot,
    balance: balance(),
    destination: acala,
    destinationFee: {
      amount: 0.06,
      asset: ldot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toAssetHub: AssetConfig[] = [
  new AssetConfig({
    asset: usdt,
    balance: balance(),
    destination: assetHub,
    destinationFee: {
      amount: 0.07,
      asset: usdt,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: usdc,
    balance: balance(),
    destination: assetHub,
    destinationFee: {
      amount: 0.7,
      asset: usdc,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
    fee: fee(),
  }),
  toAssethubExtTemplate(pink),
  toAssethubExtTemplate(ded),
  toAssethubExtTemplate(dota),
  toAssethubExtTemplate(wud),
];

const toAstar: AssetConfig[] = [
  new AssetConfig({
    asset: astr,
    balance: balance(),
    destination: astar,
    destinationFee: {
      amount: 0.00404146544,
      asset: astr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: dot,
    balance: balance(),
    destination: astar,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: balance(),
  //   destination: astar,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: balance(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: fee(),
  // }),
];

const toBifrost: AssetConfig[] = [
  new AssetConfig({
    asset: bnc,
    balance: balance(),
    destination: bifrost,
    destinationFee: {
      amount: 0.000563136,
      asset: bnc,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: vdot,
    balance: balance(),
    destination: bifrost,
    destinationFee: {
      amount: 0.0000000703,
      asset: vdot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: vastr,
    balance: balance(),
    destination: bifrost,
    destinationFee: {
      amount: 0.000000643,
      asset: vastr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: dot,
    balance: balance(),
    destination: bifrost,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: balance(),
  //   destination: bifrost,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: balance(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: fee(),
  // }),
];

const toCentrifuge: AssetConfig[] = [
  new AssetConfig({
    asset: cfg,
    balance: balance(),
    destination: centrifuge,
    destinationFee: {
      amount: 0.0092696,
      asset: cfg,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toInterlay: AssetConfig[] = [
  new AssetConfig({
    asset: ibtc,
    balance: balance(),
    destination: interlay,
    destinationFee: {
      amount: 0.00000062,
      asset: ibtc,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: intr,
    balance: balance(),
    destination: interlay,
    destinationFee: {
      amount: 0.0019213457,
      asset: intr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: dot,
    balance: balance(),
    destination: interlay,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: interlay,
    destinationFee: {
      amount: 0.5,
      asset: hdx,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: balance(),
  //   destination: interlay,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: balance(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: fee(),
  // }),
];

const toMoonbeam: AssetConfig[] = [
  new AssetConfig({
    asset: hdx,
    balance: BalanceBuilder().substrate().system().account(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.835,
      asset: hdx,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: glmr,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.01,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: dai_mwh,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: usdt_mwh,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: wbtc_mwh,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: dot,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.1,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: weth_mwh,
    balance: balance(),
    destination: moonbeam,
    destinationFee: {
      amount: 0.08,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  // TODO: Uncomment with asset hub release 1.7 (jit_withdraw fix)
  // new AssetConfig({
  //   asset: usdt,
  //   balance: balance(),
  //   destination: moonbeam,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdt,
  //     balance: balance(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: fee(),
  // }),
  // new AssetConfig({
  //   asset: usdc,
  //   balance: balance(),
  //   destination: moonbeam,
  //   destinationFee: {
  //     amount: 1.4,
  //     asset: usdc,
  //     balance: balance(),
  //   },
  //   extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(1000).X3(),
  //   fee: fee(),
  // }),
];

const toPolkadot: AssetConfig[] = [
  new AssetConfig({
    asset: dot,
    balance: balance(),
    destination: polkadot,
    destinationFee: {
      amount: 0.003,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(), //relay using x1 interior !!!
    fee: fee(),
  }),
];

const toSubsocial: AssetConfig[] = [
  new AssetConfig({
    asset: sub,
    balance: balance(),
    destination: subsocial,
    destinationFee: {
      amount: 0.064,
      asset: sub,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toZeitgeist: AssetConfig[] = [
  new AssetConfig({
    asset: ztg,
    balance: balance(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.0093,
      asset: ztg,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: usdc_mwh,
    balance: balance(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
  new AssetConfig({
    asset: glmr,
    balance: balance(),
    destination: zeitgeist,
    destinationFee: {
      amount: 0.1,
      asset: glmr,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
    fee: fee(),
  }),
];

const toPhala: AssetConfig[] = [
  new AssetConfig({
    asset: pha,
    balance: balance(),
    destination: phala,
    destinationFee: {
      amount: 0.064296,
      asset: pha,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toMythos: AssetConfig[] = [
  new AssetConfig({
    asset: myth,
    balance: balance(),
    destination: mythos,
    destinationFee: {
      amount: 0.3,
      asset: myth,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toNodle: AssetConfig[] = [
  new AssetConfig({
    asset: nodl,
    balance: balance(),
    destination: nodle,
    destinationFee: {
      amount: 0.0012,
      asset: nodl,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toUnique: AssetConfig[] = [
  new AssetConfig({
    asset: unq,
    balance: balance(),
    destination: unique,
    destinationFee: {
      amount: 0,
      asset: unq,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toCrust: AssetConfig[] = [
  new AssetConfig({
    asset: cru,
    balance: balance(),
    destination: crust,
    destinationFee: {
      amount: 0.04,
      asset: cru,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toKilt: AssetConfig[] = [
  new AssetConfig({
    asset: kilt,
    balance: balance(),
    destination: kilt_chain,
    destinationFee: {
      amount: 0.02,
      asset: kilt,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toPendulum: AssetConfig[] = [
  new AssetConfig({
    asset: pen,
    balance: balance(),
    destination: pendulum,
    destinationFee: {
      amount: 1.1,
      asset: pen,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toDarwinia: AssetConfig[] = [
  new AssetConfig({
    asset: ring,
    balance: balance(),
    destination: darwinia,
    destinationFee: {
      amount: 4,
      asset: ring,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toAjuna: AssetConfig[] = [
  new AssetConfig({
    asset: ajun,
    balance: balance(),
    destination: ajuna,
    destinationFee: {
      amount: 0.001,
      asset: ajun,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
    fee: fee(),
  }),
];

const toAcalaViaWormhole: AssetConfig[] = [
  new AssetConfig({
    asset: dai_mwh,
    balance: balance(),
    destination: acala_evm,
    destinationFee: {
      amount: 0.06,
      asset: aca,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder()
          .xTokens()
          .transferMultiCurrencies({ fee: glmr, feeAmount: MRL_XCM_FEE }),
        ExtrinsicBuilder()
          .polkadotXcm()
          .send()
          .transact({ fee: glmr, feeAmount: MRL_EXECUTION_FEE }),
      ]),
    fee: fee(),
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
  toEthereumWithRelayerTemplate(dai_mwh),
  toEthereumWithRelayerTemplate(weth_mwh),
  toEthereumWithRelayerTemplate(wbtc_mwh),
  toEthereumWithRelayerTemplate(usdt_mwh),
  toEthereumWithRelayerTemplate(usdc_mwh),
];

export const hydrationConfig = new ChainConfig({
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
  chain: hydration,
});
