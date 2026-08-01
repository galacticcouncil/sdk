import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  apyusd,
  astr,
  bnc,
  cfg_new,
  dai,
  dai_wh,
  dot,
  ena,
  eth,
  eurc,
  eurc_wh,
  jito_sol,
  prime,
  susds,
  wbtc,
  ewt,
  glmr,
  hdx,
  ibtc,
  intr,
  ksm,
  ldo,
  link,
  myth,
  neuro,
  paxg,
  pen,
  sol,
  sky,
  sui,
  susde,
  tbtc,
  trac,
  unq,
  usdc,
  usdc_wh,
  usdc_eth,
  usdt,
  usdt_wh,
  usdt_eth,
  vastr,
  vdot,
  wbtc_wh,
  weth_wh,
  wsteth,
  wud,
  lbtc,
  susds_wh,
} from '../../../assets';
import {
  assetHub,
  assetHubCex,
  astar,
  base,
  bifrost,
  energywebx,
  ethereum,
  hydration,
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

import { fee } from './configs';
import {
  toHubTemplate,
  toHubExtTemplate,
  toKusamaHubTemplate,
  toParaTemplate,
  toTransferTemplate,
  viaNttTemplate,
  viaSnowbridgeTemplate,
  viaSnowbridgeV1Template,
} from './templates';

const toAssetHub: AssetRoute[] = [
  toHubTemplate(dot, assetHub),
  toHubTemplate(ksm, assetHub),
  toHubTemplate(usdt, assetHub),
  toHubTemplate(usdc, assetHub),
  toHubExtTemplate(wud),
];

// Direct routes via the Polkadot<>Kusama bridge - first hop to the sibling
// AssetHub gateway, bridge crossing executed in custom XCM (single signature).
const toKusamaAssethub: AssetRoute[] = [
  toKusamaHubTemplate(ksm, 0.05, 0.005),
  toKusamaHubTemplate(dot, 0.2, 0.02),
];

const toAstar: AssetRoute[] = [
  toTransferTemplate(astr, astar),
  toTransferTemplate(bnc, astar, bifrost),
  new AssetRoute({
    source: {
      asset: ibtc,
      fee: fee(),
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
      fee: fee(),
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
  new AssetRoute({
    source: {
      asset: ibtc,
      fee: fee(),
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
      fee: fee(),
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

const toMythos: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: myth,
      fee: fee(),
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

const toEnergywebx: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: ewt,
      fee: fee(),
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
      fee: fee(),
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

const toEthereumViaNtt: AssetRoute[] = [
  viaNttTemplate(dai_wh, dai, ethereum),
  viaNttTemplate(susds_wh, susds, ethereum),
  viaNttTemplate(usdc_wh, usdc, ethereum),
  viaNttTemplate(usdt_wh, usdt, ethereum),
  viaNttTemplate(wbtc_wh, wbtc, ethereum),
  viaNttTemplate(weth_wh, eth, ethereum),
];

const toBaseViaNtt: AssetRoute[] = [viaNttTemplate(eurc_wh, eurc, base)];

const toSolanaViaNtt: AssetRoute[] = [
  viaNttTemplate(sol, sol, solana),
  viaNttTemplate(jito_sol, jito_sol, solana),
  viaNttTemplate(prime, prime, solana),
];

const toSuiViaNtt: AssetRoute[] = [viaNttTemplate(sui, sui, sui_chain)];

const toEthereumViaSnowbridge: AssetRoute[] = [
  viaSnowbridgeTemplate(eth, eth, ethereum),
  viaSnowbridgeTemplate(aave, aave, ethereum),
  viaSnowbridgeTemplate(apyusd, apyusd, ethereum),
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

// Snowbridge V1 (legacy, cheaper) outbound routes. Registered after the V2
// routes so the default/`Snowbridge`-tag selection still resolves to V2; the
// V1 route is reached via the `SnowbridgeV1` tag from the UI switch.
const toEthereumViaSnowbridgeV1: AssetRoute[] = [
  viaSnowbridgeV1Template(eth, eth, ethereum),
  viaSnowbridgeV1Template(aave, aave, ethereum),
  viaSnowbridgeV1Template(apyusd, apyusd, ethereum),
  viaSnowbridgeV1Template(cfg_new, cfg_new, ethereum),
  viaSnowbridgeV1Template(ena, ena, ethereum),
  viaSnowbridgeV1Template(paxg, paxg, ethereum),
  viaSnowbridgeV1Template(susde, susde, ethereum),
  viaSnowbridgeV1Template(tbtc, tbtc, ethereum),
  viaSnowbridgeV1Template(trac, trac, ethereum),
  viaSnowbridgeV1Template(lbtc, lbtc, ethereum),
  viaSnowbridgeV1Template(ldo, ldo, ethereum),
  viaSnowbridgeV1Template(link, link, ethereum),
  viaSnowbridgeV1Template(sky, sky, ethereum),
  viaSnowbridgeV1Template(wsteth, wsteth, ethereum),
  viaSnowbridgeV1Template(usdc_eth, usdc, ethereum),
  viaSnowbridgeV1Template(usdt_eth, usdt, ethereum),
];

const toCex: AssetRoute[] = [
  toHubTemplate(dot, assetHubCex),
  toHubTemplate(usdt, assetHubCex),
  toHubTemplate(usdc, assetHubCex),
];

export const hydrationConfig = new ChainRoutes({
  chain: hydration,
  routes: [
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCex,
    ...toBaseViaNtt,
    ...toEthereumViaNtt,
    ...toEthereumViaSnowbridge,
    ...toSolanaViaNtt,
    ...toSuiViaNtt,
    ...toEthereumViaSnowbridgeV1,
    ...toEnergywebx,
    ...toKusamaAssethub,
    ...toMythos,
    ...toNeuroweb,
    ...toPendulum,
    ...toUnique,
  ],
});
