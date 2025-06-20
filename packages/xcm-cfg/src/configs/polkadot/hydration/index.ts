import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import {
  aave,
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
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  kilt,
  ksm,
  laos,
  ldo,
  ldot,
  link,
  myth,
  nodl,
  pen,
  pha,
  pink,
  ring,
  sol,
  sky,
  sub,
  susde,
  tbtc,
  unq,
  usdc,
  usdc_mwh,
  usdc_eth,
  usdt,
  usdt_mwh,
  usdt_eth,
  vastr,
  vdot,
  ztg,
  wbtc,
  wbtc_awh,
  wbtc_mwh,
  weth_awh,
  weth_mwh,
  wsteth,
  wud,
  lbtc,
} from '../../../assets';
import {
  acala,
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
  laos_chain,
  moonbeam,
  mythos,
  nodle,
  pendulum,
  polkadot,
  phala,
  subsocial,
  unique,
  zeitgeist,
  polkadotCex,
  energywebx,
} from '../../../chains';
import { ExtrinsicBuilder, XcmTransferType } from '../../../builders';

import { balance, fee } from './configs';
import {
  toHubExtTemplate,
  toHubWithCexFwd2Template,
  toEthereumViaSnowbridgeTemplate,
  toEthereumViaWormholeTemplate,
  toMoonbeamErc20Template,
  toSolanaViaWormholeTemplate,
  toZeitgeistErc20Template,
  toTransferTemplate,
} from './templates';

const toAcala: AssetRoute[] = [
  toTransferTemplate(dai_awh, acala, 0.00092696),
  toTransferTemplate(wbtc_awh, acala, 0.00000004),
  toTransferTemplate(weth_awh, acala, 0.000000687004),
  toTransferTemplate(aca, acala, 1),
  toTransferTemplate(ldot, acala, 0.06),
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
        amount: 0.19,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  }),
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
      chain: assetHub,
      asset: ksm,
      fee: {
        amount: 0.05,
        asset: ksm,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
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
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(),
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
        amount: 0.07,
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transferMultiasset(),
  }),
  toHubExtTemplate(pink),
  toHubExtTemplate(ded),
  toHubExtTemplate(dota),
  toHubExtTemplate(wud),
];

const toAstar: AssetRoute[] = [
  toTransferTemplate(astr, astar, 0.00404146544),
  toTransferTemplate(dot, astar, 0.1),
  toTransferTemplate(bnc, astar, 0.75),
  toTransferTemplate(glmr, astar, 0.025),
  toTransferTemplate(ibtc, astar, 0.000002),
  toTransferTemplate(intr, astar, 0.01),
  toTransferTemplate(pha, astar, 0.3),
  toTransferTemplate(vdot, astar, 0.0004),
  toTransferTemplate(vastr, astar, 0.005),
  toTransferTemplate(usdt, astar, 0.3),
  toTransferTemplate(usdc, astar, 0.3),
];

const toBifrost: AssetRoute[] = [
  toTransferTemplate(bnc, bifrost, 0.000563136),
  toTransferTemplate(vdot, bifrost, 0.0000000703),
  toTransferTemplate(vastr, bifrost, 0.000000643),
  toTransferTemplate(dot, bifrost, 0.1),
  toTransferTemplate(astr, bifrost, 0.5),
  toTransferTemplate(glmr, bifrost, 0.1),
  toTransferTemplate(ibtc, bifrost, 0.000005),
  toTransferTemplate(usdt, bifrost, 0.3),
  toTransferTemplate(usdc, bifrost, 0.3),
];

const toCentrifuge: AssetRoute[] = [
  toTransferTemplate(cfg, centrifuge, 0.0092696),
  toTransferTemplate(dot, centrifuge, 0.1),
  toTransferTemplate(glmr, centrifuge, 0.05),
];

const toInterlay: AssetRoute[] = [
  toTransferTemplate(ibtc, interlay, 0.00000062),
  toTransferTemplate(intr, interlay, 0.0019213457),
  toTransferTemplate(dot, interlay, 0.1),
  toTransferTemplate(hdx, interlay, 0.5),
  toTransferTemplate(usdt, interlay, 0.3),
  toTransferTemplate(usdc, interlay, 0.3),
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
      chain: interlay,
      asset: vdot,
      fee: {
        amount: 0.01,
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().xTokens().transfer(),
  }),
];

const toMoonbeam: AssetRoute[] = [
  toTransferTemplate(hdx, moonbeam, 5),
  toTransferTemplate(glmr, moonbeam, 0.01),
  toTransferTemplate(dot, moonbeam, 0.1),
  toTransferTemplate(usdt, moonbeam, 0.3),
  toTransferTemplate(usdc, moonbeam, 0.3),
  toMoonbeamErc20Template(dai_mwh),
  toMoonbeamErc20Template(usdc_mwh),
  toMoonbeamErc20Template(usdt_mwh),
  toMoonbeamErc20Template(wbtc_mwh),
  toMoonbeamErc20Template(weth_mwh),
  toMoonbeamErc20Template(sol),
];

const toPolkadot: AssetRoute[] = [toTransferTemplate(dot, polkadot, 0.003)];

const toSubsocial: AssetRoute[] = [toTransferTemplate(sub, subsocial, 0.064)];

const toZeitgeist: AssetRoute[] = [
  toTransferTemplate(ztg, zeitgeist, 0.0093),
  toTransferTemplate(glmr, zeitgeist, 0.002),
  toZeitgeistErc20Template(usdc_mwh),
];

const toPhala: AssetRoute[] = [toTransferTemplate(pha, phala, 0.064296)];

const toMythos: AssetRoute[] = [toTransferTemplate(myth, mythos, 2.5)];

const toNodle: AssetRoute[] = [toTransferTemplate(nodl, nodle, 0.0012)];

const toUnique: AssetRoute[] = [toTransferTemplate(unq, unique, 0)];

const toCrust: AssetRoute[] = [toTransferTemplate(cru, crust, 0.04)];

const toKilt: AssetRoute[] = [toTransferTemplate(kilt, kilt_chain, 0.02)];

const toLaos: AssetRoute[] = [toTransferTemplate(laos, laos_chain, 0.1)];

const toEnergywebx: AssetRoute[] = [toTransferTemplate(ewt, energywebx, 0.02)];

const toPendulum: AssetRoute[] = [toTransferTemplate(pen, pendulum, 1.1)];

const toDarwinia: AssetRoute[] = [toTransferTemplate(ring, darwinia, 4)];

const toAjuna: AssetRoute[] = [toTransferTemplate(ajun, ajuna, 0.001)];

const toEthereumViaWormhole: AssetRoute[] = [
  toEthereumViaWormholeTemplate(dai_mwh, dai),
  toEthereumViaWormholeTemplate(weth_mwh, eth),
  toEthereumViaWormholeTemplate(wbtc_mwh, wbtc),
  toEthereumViaWormholeTemplate(usdt_mwh, usdt),
  toEthereumViaWormholeTemplate(usdc_mwh, usdc),
];

const toEthereumViaSnowbridge: AssetRoute[] = [
  toEthereumViaSnowbridgeTemplate(eth, eth),
  toEthereumViaSnowbridgeTemplate(aave, aave),
  toEthereumViaSnowbridgeTemplate(susde, susde),
  toEthereumViaSnowbridgeTemplate(tbtc, tbtc),
  toEthereumViaSnowbridgeTemplate(lbtc, lbtc),
  toEthereumViaSnowbridgeTemplate(ldo, ldo),
  toEthereumViaSnowbridgeTemplate(link, link),
  toEthereumViaSnowbridgeTemplate(sky, sky),
  toEthereumViaSnowbridgeTemplate(wsteth, wsteth),
  toEthereumViaSnowbridgeTemplate(usdc_eth, usdc),
  toEthereumViaSnowbridgeTemplate(usdt_eth, usdt),
];

const toSolanaViaWormhole: AssetRoute[] = [
  toSolanaViaWormholeTemplate(sol, sol),
];

const toCexViaRelay = new AssetRoute({
  source: {
    asset: dot,
    balance: balance(),
    fee: fee(),
    destinationFee: {
      balance: balance(),
    },
  },
  destination: {
    chain: polkadotCex,
    asset: dot,
    fee: {
      amount: 1.1,
      asset: dot,
    },
  },
  extrinsic: ExtrinsicBuilder()
    .utility()
    .batchAll([
      ExtrinsicBuilder().xTokens().transfer(),
      ExtrinsicBuilder().polkadotXcm().send().transact({
        fee: 0.01,
      }),
    ]),
  transact: {
    chain: polkadot,
    fee: {
      amount: 0,
      asset: dot,
      balance: balance(),
    },
    extrinsic: ExtrinsicBuilder().balances().transferAll(),
  },
});

const toCex: AssetRoute[] = [
  toHubWithCexFwd2Template(usdt),
  toHubWithCexFwd2Template(usdc),
  toCexViaRelay,
];

export const hydrationConfig = new ChainRoutes({
  chain: hydration,
  routes: [
    ...toAcala,
    ...toAjuna,
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCentrifuge,
    ...toCex,
    ...toCrust,
    ...toDarwinia,
    ...toEthereumViaSnowbridge,
    ...toEthereumViaWormhole,
    ...toInterlay,
    ...toKilt,
    ...toLaos,
    ...toEnergywebx,
    ...toMoonbeam,
    ...toMythos,
    ...toNodle,
    ...toPhala,
    ...toPolkadot,
    ...toPendulum,
    ...toSolanaViaWormhole,
    ...toSubsocial,
    ...toUnique,
    ...toZeitgeist,
  ],
});
