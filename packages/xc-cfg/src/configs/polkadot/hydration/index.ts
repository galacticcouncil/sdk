import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  ajun,
  apyusd,
  astr,
  bnc,
  cfg_new,
  cru,
  dai,
  dai_mwh,
  dot,
  ena,
  eth,
  eurc,
  eurc_mwh,
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  jito_sol,
  ksm,
  ldo,
  link,
  myth,
  neuro,
  paxg,
  pen,
  prime,
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
  wbtc,
  wbtc_mwh,
  weth_mwh,
  wsteth,
  wud,
  lbtc,
  susds_mwh,
  susds,
} from '../../../assets';
import {
  ajuna,
  assetHub,
  assetHubCex,
  astar,
  base,
  bifrost,
  crust,
  energywebx,
  ethereum,
  hydration,
  interlay,
  moonbeam,
  mythos,
  neuroweb,
  pendulum,
  solana,
  sui_chain,
  unique,
} from '../../../chains';
import {
  ExtrinsicBuilder,
  FeeAmountBuilder,
  XcmTransferType,
} from '../../../builders';

import { balance, fee } from './configs';
import {
  toHubTemplate,
  toHubExtTemplate,
  toMoonbeamErc20Template,
  toParaTemplate,
  toTransferTemplate,
  viaSnowbridgeTemplate,
  viaWormholeBridgeTemplate,
} from './templates';

const toAssetHub: AssetRoute[] = [
  toHubTemplate(dot, assetHub),
  toHubTemplate(ksm, assetHub),
  toHubTemplate(usdt, assetHub),
  toHubTemplate(usdc, assetHub),
  toHubExtTemplate(wud),
];

const toAstar: AssetRoute[] = [
  toTransferTemplate(astr, astar),
  toTransferTemplate(bnc, astar, bifrost),
  toTransferTemplate(glmr, astar, moonbeam),
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
      chain: astar,
      asset: ibtc,
      fee: {
        amount: 0.000002,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
      chain: astar,
      asset: intr,
      fee: {
        amount: 0.01,
        asset: intr,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
  toTransferTemplate(vdot, astar, bifrost),
  toTransferTemplate(vastr, astar, bifrost),
  toTransferTemplate(usdt, astar, assetHub),
  toTransferTemplate(usdc, astar, assetHub),
];

const toBifrost: AssetRoute[] = [
  toTransferTemplate(bnc, bifrost),
  toTransferTemplate(vdot, bifrost),
  toTransferTemplate(vastr, bifrost),
  toTransferTemplate(astr, bifrost, astar),
  toTransferTemplate(glmr, bifrost, moonbeam),
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
      chain: bifrost,
      asset: ibtc,
      fee: {
        amount: 0.000005,
        asset: ibtc,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
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
          .XcmPaymentApi()
          .calculateDestFee({ reserve: assetHub }),
        asset: dot,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().transferAssetsUsingTypeAndThen({
      transferType: XcmTransferType.RemoteReserve,
    }),
  }),
];

const toInterlay: AssetRoute[] = [
  toParaTemplate(ibtc, interlay, 0.00000062),
  toParaTemplate(intr, interlay, 0.0019213457),
  toParaTemplate(hdx, interlay, 0.5),
  toParaTemplate(usdt, interlay, 0.3),
  toParaTemplate(usdc, interlay, 0.3),
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
        amount: 0.05,
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
        amount: 2.5,
        asset: myth,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

const toUnique: AssetRoute[] = [toTransferTemplate(unq, unique)];

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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

const toEnergywebx: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ewt,
      balance: balance(),
      fee: fee(),
      destinationFee: {
        balance: balance(),
      },
    },
    destination: {
      chain: energywebx,
      asset: ewt,
      fee: {
        amount: 0.02,
        asset: ewt,
      },
    },
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
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
    extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
  }),
];

const toNeuroweb: AssetRoute[] = [toTransferTemplate(neuro, neuroweb)];

const toAjuna: AssetRoute[] = [toTransferTemplate(ajun, ajuna)];

const toBaseViaWormhole: AssetRoute[] = [
  viaWormholeBridgeTemplate(eurc_mwh, eurc, base),
];

const toEthereumViaWormhole: AssetRoute[] = [
  viaWormholeBridgeTemplate(dai_mwh, dai, ethereum),
  viaWormholeBridgeTemplate(weth_mwh, eth, ethereum),
  viaWormholeBridgeTemplate(wbtc_mwh, wbtc, ethereum),
  viaWormholeBridgeTemplate(usdt_mwh, usdt, ethereum),
  viaWormholeBridgeTemplate(usdc_mwh, usdc, ethereum),
  viaWormholeBridgeTemplate(susds_mwh, susds, ethereum),
];

const toEthereumViaSnowbridge: AssetRoute[] = [
  viaSnowbridgeTemplate(eth, eth, ethereum),
  viaSnowbridgeTemplate(eth, eth, ethereum, { fast: true }),
  viaSnowbridgeTemplate(aave, aave, ethereum),
  viaSnowbridgeTemplate(aave, aave, ethereum, { fast: true }),
  viaSnowbridgeTemplate(apyusd, apyusd, ethereum),
  viaSnowbridgeTemplate(apyusd, apyusd, ethereum, { fast: true }),
  viaSnowbridgeTemplate(cfg_new, cfg_new, ethereum),
  viaSnowbridgeTemplate(cfg_new, cfg_new, ethereum, { fast: true }),
  viaSnowbridgeTemplate(ena, ena, ethereum),
  viaSnowbridgeTemplate(ena, ena, ethereum, { fast: true }),
  viaSnowbridgeTemplate(paxg, paxg, ethereum),
  viaSnowbridgeTemplate(paxg, paxg, ethereum, { fast: true }),
  viaSnowbridgeTemplate(susde, susde, ethereum),
  viaSnowbridgeTemplate(susde, susde, ethereum, { fast: true }),
  viaSnowbridgeTemplate(tbtc, tbtc, ethereum),
  viaSnowbridgeTemplate(tbtc, tbtc, ethereum, { fast: true }),
  viaSnowbridgeTemplate(trac, trac, ethereum),
  viaSnowbridgeTemplate(trac, trac, ethereum, { fast: true }),
  viaSnowbridgeTemplate(lbtc, lbtc, ethereum),
  viaSnowbridgeTemplate(lbtc, lbtc, ethereum, { fast: true }),
  viaSnowbridgeTemplate(ldo, ldo, ethereum),
  viaSnowbridgeTemplate(ldo, ldo, ethereum, { fast: true }),
  viaSnowbridgeTemplate(link, link, ethereum),
  viaSnowbridgeTemplate(link, link, ethereum, { fast: true }),
  viaSnowbridgeTemplate(sky, sky, ethereum),
  viaSnowbridgeTemplate(sky, sky, ethereum, { fast: true }),
  viaSnowbridgeTemplate(wsteth, wsteth, ethereum),
  viaSnowbridgeTemplate(wsteth, wsteth, ethereum, { fast: true }),
  viaSnowbridgeTemplate(usdc_eth, usdc, ethereum),
  viaSnowbridgeTemplate(usdc_eth, usdc, ethereum, { fast: true }),
  viaSnowbridgeTemplate(usdt_eth, usdt, ethereum),
  viaSnowbridgeTemplate(usdt_eth, usdt, ethereum, { fast: true }),
];

const toSolanaViaWormhole: AssetRoute[] = [
  viaWormholeBridgeTemplate(sol, sol, solana),
  viaWormholeBridgeTemplate(jito_sol, jito_sol, solana),
  viaWormholeBridgeTemplate(prime, prime, solana),
];

const toSuiViaWormhole: AssetRoute[] = [
  viaWormholeBridgeTemplate(sui, sui, sui_chain),
];

const toCex: AssetRoute[] = [
  toHubTemplate(dot, assetHubCex),
  toHubTemplate(usdt, assetHubCex),
  toHubTemplate(usdc, assetHubCex),
];

export const hydrationConfig = new ChainRoutes({
  chain: hydration,
  routes: [
    ...toAjuna,
    ...toAssetHub,
    ...toAstar,
    ...toBaseViaWormhole,
    ...toBifrost,
    ...toCex,
    ...toCrust,
    ...toEthereumViaSnowbridge,
    ...toEthereumViaWormhole,
    ...toInterlay,
    ...toEnergywebx,
    ...toMoonbeam,
    ...toMythos,
    ...toNeuroweb,
    ...toPendulum,
    ...toSolanaViaWormhole,
    ...toSuiViaWormhole,
    ...toUnique,
  ],
});
