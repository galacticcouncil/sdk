import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  aca,
  ajun,
  astr,
  bnc,
  cfg,
  cru,
  dai,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  eth,
  glmr,
  hdx,
  ibtc,
  intr,
  kilt,
  ldot,
  myth,
  nodl,
  pen,
  pha,
  pink,
  ring,
  sub,
  unq,
  usdc,
  usdc_mwh,
  usdt,
  usdt_mwh,
  vastr,
  vdot,
  ztg,
  wbtc,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
  wud,
  aave,
  susde,
} from '../../../assets';
import {
  acala,
  acala_evm,
  ajuna,
  assetHub,
  astar,
  bifrost,
  centrifuge,
  crust,
  darwinia,
  hydration,
  interlay,
  kilt_chain,
  moonbeam,
  mythos,
  nodle,
  pendulum,
  polkadot,
  phala,
  subsocial,
  unique,
  zeitgeist,
} from '../../../chains';
import {
  ContractBuilder,
  ExtrinsicBuilder,
  ExtrinsicBuilderV4,
  XcmTransferType,
} from '../../../builders';

import { balance, fee } from './configs';
import {
  toHubExtTemplate,
  toEthereumViaSnowbridgeTemplate,
  toEthereumViaWormholeTemplate,
  toMoonbeamErc20Template,
  toZeitgeistErc20Template,
  MRL_EXECUTION_FEE,
  MRL_XCM_FEE,
} from './templates';

const toAcala: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dai_awh,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala,
      asset: dai_awh,
      fee: {
        amount: 0.00092696,
        asset: dai_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: wbtc_awh,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala,
      asset: wbtc_awh,
      fee: {
        amount: 0.00000004,
        asset: wbtc_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: weth_awh,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala,
      asset: weth_awh,
      fee: {
        amount: 0.000000687004,
        asset: weth_awh,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: aca,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala,
      asset: aca,
      fee: {
        amount: 1,
        asset: aca,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: ldot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala,
      asset: ldot,
      fee: {
        amount: 0.06,
        asset: ldot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toAssetHub: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: assetHub,
      asset: dot,
      fee: {
        amount: 0.0036,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilderV4()
      .polkadotXcm()
      .transferAssetsUsingTypeAndThen({
        transferType: XcmTransferType.DestinationReserve,
      }),
  }),
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
      chain: assetHub,
      asset: usdt,
      fee: {
        amount: 0.07,
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
  }),
  new AssetRoute({
    source: {
      asset: usdc,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: assetHub,
      asset: usdc,
      fee: {
        amount: 0.7,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset().X3(),
  }),
  toHubExtTemplate(pink),
  toHubExtTemplate(ded),
  toHubExtTemplate(dota),
  toHubExtTemplate(wud),
];

const toAstar: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: astr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: astar,
      asset: astr,
      fee: {
        amount: 0.00404146544,
        asset: astr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: astar,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toBifrost: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: bnc,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: bifrost,
      asset: bnc,
      fee: {
        amount: 0.000563136,
        asset: bnc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: vdot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: bifrost,
      asset: vdot,
      fee: {
        amount: 0.0000000703,
        asset: vdot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: vastr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: bifrost,
      asset: vastr,
      fee: {
        amount: 0.000000643,
        asset: vastr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: bifrost,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toCentrifuge: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cfg,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: centrifuge,
      asset: cfg,
      fee: {
        amount: 0.0092696,
        asset: cfg,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toInterlay: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ibtc,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: interlay,
      asset: ibtc,
      fee: {
        amount: 0.00000062,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: intr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: interlay,
      asset: intr,
      fee: {
        amount: 0.0019213457,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: interlay,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: hdx,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: interlay,
      asset: hdx,
      fee: {
        amount: 0.5,
        asset: hdx,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toMoonbeam: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: hdx,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: hdx,
      fee: {
        amount: 0.835,
        asset: hdx,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: glmr,
      fee: {
        amount: 0.01,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: dot,
      fee: {
        amount: 0.1,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  toMoonbeamErc20Template(dai_mwh),
  toMoonbeamErc20Template(usdc_mwh),
  toMoonbeamErc20Template(usdt_mwh),
  toMoonbeamErc20Template(wbtc_mwh),
  toMoonbeamErc20Template(weth_mwh),
];

const toPolkadot: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dot,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: polkadot,
      asset: dot,
      fee: {
        amount: 0.003,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toSubsocial: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: sub,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: subsocial,
      asset: sub,
      fee: {
        amount: 0.064,
        asset: sub,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toZeitgeist: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ztg,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: zeitgeist,
      asset: ztg,
      fee: {
        amount: 0.0093,
        asset: ztg,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  new AssetRoute({
    source: {
      asset: glmr,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: zeitgeist,
      asset: glmr,
      fee: {
        amount: 0.002,
        asset: glmr,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
  toZeitgeistErc20Template(usdc_mwh),
];

const toPhala: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pha,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: phala,
      asset: pha,
      fee: {
        amount: 0.064296,
        asset: pha,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toMythos: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: mythos,
      asset: myth,
      fee: {
        amount: 0.3,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toNodle: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: nodl,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: nodle,
      asset: nodl,
      fee: {
        amount: 0.0012,
        asset: nodl,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toUnique: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: unq,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: unique,
      asset: unq,
      fee: {
        amount: 0,
        asset: unq,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toCrust: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: cru,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: crust,
      asset: cru,
      fee: {
        amount: 0.04,
        asset: cru,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toKilt: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: kilt,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: kilt_chain,
      asset: kilt,
      fee: {
        amount: 0.02,
        asset: kilt,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toPendulum: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: pen,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: pendulum,
      asset: pen,
      fee: {
        amount: 1.1,
        asset: pen,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toDarwinia: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ring,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: darwinia,
      asset: ring,
      fee: {
        amount: 4,
        asset: ring,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toAjuna: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ajun,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: ajuna,
      asset: ajun,
      fee: {
        amount: 0.001,
        asset: ajun,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toAcalaViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dai_mwh,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: acala_evm,
      asset: dai_awh,
      fee: {
        amount: 0.06,
        asset: aca,
      },
    },
    extrinsic: ExtrinsicBuilder()
      .utility()
      .batchAll([
        ExtrinsicBuilder().xTokens().transferMultiCurrencies(),
        ExtrinsicBuilder().polkadotXcm().send().transact({
          fee: MRL_EXECUTION_FEE,
        }),
      ]),
    transact: {
      chain: moonbeam,
      fee: {
        amount: MRL_XCM_FEE,
        asset: glmr,
        balance: balance(),
      },
      extrinsic: ExtrinsicBuilder()
        .ethereumXcm()
        .transact(
          ContractBuilder()
            .Batch()
            .batchAll([
              ContractBuilder().Erc20().approve(),
              ContractBuilder().Wormhole().TokenBridge().transferTokens(),
            ])
        ),
    },
  }),
];

const toEthereumViaWormhole: AssetRoute[] = [
  toEthereumViaWormholeTemplate(dai_mwh, dai),
  toEthereumViaWormholeTemplate(weth_mwh, eth),
  toEthereumViaWormholeTemplate(wbtc_mwh, wbtc),
  toEthereumViaWormholeTemplate(usdt_mwh, usdt),
  toEthereumViaWormholeTemplate(usdc_mwh, usdc),
];

const toEthereumViaSnowbridge: AssetRoute[] = [
  toEthereumViaSnowbridgeTemplate(aave, aave),
  toEthereumViaSnowbridgeTemplate(susde, susde),
];

export const hydrationConfig = new ChainRoutes({
  chain: hydration,
  routes: [
    ...toAcala,
    ...toAcalaViaWormhole,
    ...toAjuna,
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCentrifuge,
    ...toCrust,
    ...toDarwinia,
    ...toEthereumViaSnowbridge,
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
});
