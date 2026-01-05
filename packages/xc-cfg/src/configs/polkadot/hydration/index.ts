import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  aca,
  ajun,
  astr,
  bnc,
  cfg,
  cfg_new,
  cru,
  dai,
  dai_awh,
  dai_mwh,
  ded,
  dot,
  dota,
  ena,
  eth,
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  jito_sol,
  kilt,
  ksm,
  laos,
  ldo,
  ldot,
  link,
  myth,
  neuro,
  nodl,
  paxg,
  pen,
  pha,
  pink,
  ring,
  sol,
  sui,
  sky,
  susde,
  tbtc,
  trac,
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
  susds_mwh,
  susds,
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
  energywebx,
  ethereum,
  hydration,
  interlay,
  kilt_chain,
  laos_chain,
  moonbeam,
  mythos,
  neuroweb,
  pendulum,
  polkadot,
  solana,
  sui_chain,
  unique,
  zeitgeist,
} from '../../../chains';
import {
  ExtrinsicBuilder,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';

import { balance, fee } from './configs';
import {
  toHubExtTemplate,
  toHubWithCexFwdTemplate,
  toMoonbeamErc20Template,
  toZeitgeistErc20Template,
  toTransferTemplate,
  viaSnowbridgeTemplate,
  viaWormholeRelayerTemplate,
  viaWormholeBridgeTemplate,
} from './templates';

const toAcala: AssetRoute[] = [
  toTransferTemplate(dai_awh, acala),
  toTransferTemplate(wbtc_awh, acala),
  toTransferTemplate(weth_awh, acala),
  toTransferTemplate(aca, acala),
  toTransferTemplate(ldot, acala),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: usdt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: usdc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    }),
  }),
  toHubExtTemplate(pink),
  toHubExtTemplate(ded),
  toHubExtTemplate(dota),
  toHubExtTemplate(wud),
];

const toAstar: AssetRoute[] = [
  toTransferTemplate(astr, astar),
  toTransferTemplate(bnc, astar, bifrost),
  toTransferTemplate(glmr, astar),
  toTransferTemplate(ibtc, astar),
  toTransferTemplate(intr, astar),
  toTransferTemplate(pha, astar),
  toTransferTemplate(vdot, astar, bifrost),
  toTransferTemplate(vastr, astar),
  toTransferTemplate(usdt, astar, assetHub),
  toTransferTemplate(usdc, astar, assetHub),
];

const toBifrost: AssetRoute[] = [
  toTransferTemplate(bnc, bifrost),
  toTransferTemplate(vdot, bifrost),
  toTransferTemplate(vastr, bifrost),
  toTransferTemplate(dot, bifrost),
  toTransferTemplate(astr, bifrost),
  toTransferTemplate(glmr, bifrost),
  toTransferTemplate(ibtc, bifrost),
  toTransferTemplate(usdt, bifrost, assetHub),
  toTransferTemplate(usdc, bifrost, assetHub),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee({ reserve: polkadot }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.RemoteReserve,
    }),
  }),
];

const toCentrifuge: AssetRoute[] = [
  toTransferTemplate(cfg, centrifuge),
  toTransferTemplate(glmr, centrifuge),
];

const toInterlay: AssetRoute[] = [
  toTransferTemplate(ibtc, interlay),
  toTransferTemplate(intr, interlay),
  toTransferTemplate(hdx, interlay),
  toTransferTemplate(usdt, interlay, assetHub),
  toTransferTemplate(usdc, interlay, assetHub),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee(),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
        amount: FeeAmountBuilder()
          .PolkadotXcm()
          .calculateLimitedReserveTransferFee({ reserve: polkadot }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.RemoteReserve,
    }),
  }),
];

const toMoonbeam: AssetRoute[] = [
  toTransferTemplate(hdx, moonbeam),
  toTransferTemplate(glmr, moonbeam),
  toTransferTemplate(usdt, moonbeam, assetHub),
  toTransferTemplate(usdc, moonbeam, assetHub),
  toMoonbeamErc20Template(dai_mwh),
  toMoonbeamErc20Template(susds_mwh),
  toMoonbeamErc20Template(usdc_mwh),
  toMoonbeamErc20Template(usdt_mwh),
  toMoonbeamErc20Template(wbtc_mwh),
  toMoonbeamErc20Template(weth_mwh),
  toMoonbeamErc20Template(sol),
];

const toZeitgeist: AssetRoute[] = [
  toTransferTemplate(ztg, zeitgeist),
  toTransferTemplate(glmr, zeitgeist),
  toZeitgeistErc20Template(usdc_mwh),
];

const toMythos: AssetRoute[] = [toTransferTemplate(myth, mythos)];

const toUnique: AssetRoute[] = [toTransferTemplate(unq, unique)];

const toCrust: AssetRoute[] = [toTransferTemplate(cru, crust)];

const toKilt: AssetRoute[] = [toTransferTemplate(kilt, kilt_chain)];

const toLaos: AssetRoute[] = [toTransferTemplate(laos, laos_chain)];

const toEnergywebx: AssetRoute[] = [toTransferTemplate(ewt, energywebx)];

const toPendulum: AssetRoute[] = [toTransferTemplate(pen, pendulum)];

const toNeuroweb: AssetRoute[] = [toTransferTemplate(neuro, neuroweb)];

const toDarwinia: AssetRoute[] = [toTransferTemplate(ring, darwinia)];

const toAjuna: AssetRoute[] = [toTransferTemplate(ajun, ajuna)];

const toEthereumViaWormhole: AssetRoute[] = [
  viaWormholeRelayerTemplate(dai_mwh, dai, ethereum),
  viaWormholeRelayerTemplate(weth_mwh, eth, ethereum),
  viaWormholeRelayerTemplate(wbtc_mwh, wbtc, ethereum),
  viaWormholeRelayerTemplate(usdt_mwh, usdt, ethereum),
  viaWormholeRelayerTemplate(usdc_mwh, usdc, ethereum),
  viaWormholeBridgeTemplate(susds_mwh, susds, ethereum),
];

const toEthereumViaSnowbridge: AssetRoute[] = [
  viaSnowbridgeTemplate(eth, eth, ethereum),
  viaSnowbridgeTemplate(aave, aave, ethereum),
  viaSnowbridgeTemplate(cfg_new, cfg_new, ethereum),
  viaSnowbridgeTemplate(ena, ena, ethereum),
  viaSnowbridgeTemplate(paxg, paxg, ethereum),
  viaSnowbridgeTemplate(susde, susde, ethereum),
  viaSnowbridgeTemplate(tbtc, tbtc, ethereum),
  viaSnowbridgeTemplate(trac, trac, ethereum),
  viaSnowbridgeTemplate(lbtc, lbtc, ethereum),
  viaSnowbridgeTemplate(ldo, ldo, ethereum),
  viaSnowbridgeTemplate(link, link, ethereum),
  viaSnowbridgeTemplate(sky, sky, ethereum),
  viaSnowbridgeTemplate(wsteth, wsteth, ethereum),
  viaSnowbridgeTemplate(usdc_eth, usdc, ethereum),
  viaSnowbridgeTemplate(usdt_eth, usdt, ethereum),
];

const toSolanaViaWormhole: AssetRoute[] = [
  viaWormholeRelayerTemplate(sol, sol, solana),
  viaWormholeBridgeTemplate(jito_sol, jito_sol, solana),
];

const toSuiViaWormhole: AssetRoute[] = [
  viaWormholeRelayerTemplate(sui, sui, sui_chain),
];

const toCex: AssetRoute[] = [
  toHubWithCexFwdTemplate(
    usdt,
    0.1,
    ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    })
  ),
  toHubWithCexFwdTemplate(
    usdc,
    0.1,
    ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    })
  ),
  toHubWithCexFwdTemplate(
    dot,
    0.2,
    ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.DestinationReserve,
    })
  ),
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
    ...toNeuroweb,
    ...toPendulum,
    ...toSolanaViaWormhole,
    ...toSuiViaWormhole,
    ...toUnique,
    ...toZeitgeist,
  ],
});
