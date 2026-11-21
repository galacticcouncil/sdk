import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  apyusd,
  astr,
  bnc,
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
  hollar,
  hype,
  ibtc,
  intr,
  ksm,
  ldo,
  link,
  myth,
  near,
  neuro,
  paxg,
  pen,
  sol,
  spy,
  sky,
  sui,
  susde,
  tbtc,
  trac,
  unq,
  usdc,
  usdc_wh,
  usdt,
  usdt_wh,
  vastr,
  vdot,
  wbtc_wh,
  weth_wh,
  wsol,
  wsteth,
  wud,
  susds_wh,
  wnear,
  zec,
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
  hyperevm,
  mythos,
  near_chain,
  neuroweb,
  pendulum,
  robinhood,
  solana,
  sui_chain,
  unique,
  zcash,
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
  viaNttExecutorTemplate,
  viaNttTemplate,
  viaOmniTemplate,
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
  viaNttTemplate(aave, aave, ethereum),
  viaNttTemplate(apyusd, apyusd, ethereum),
  viaNttTemplate(ena, ena, ethereum),
  viaNttTemplate(ldo, ldo, ethereum),
  viaNttTemplate(link, link, ethereum),
  viaNttTemplate(paxg, paxg, ethereum),
  viaNttTemplate(sky, sky, ethereum),
  viaNttTemplate(susde, susde, ethereum),
  viaNttTemplate(tbtc, tbtc, ethereum),
  viaNttTemplate(trac, trac, ethereum),
  viaNttTemplate(wsteth, wsteth, ethereum),
];

const toBaseViaNtt: AssetRoute[] = [viaNttTemplate(eurc_wh, eurc, base)];

const toHyperevmViaNtt: AssetRoute[] = [viaNttTemplate(hype, hype, hyperevm)];

// Self-redeem only - no executor serves NEAR
const toNearViaNtt: AssetRoute[] = [
  viaNttTemplate(near, wnear, near_chain),
  viaNttTemplate(zec, zec, near_chain),
];

// Over NEAR, where Omni's connector withdraws it to Zcash
const toZcashViaOmni: AssetRoute[] = [viaOmniTemplate(zec, zcash, near_chain)];

const toRobinhoodViaNtt: AssetRoute[] = [
  viaNttTemplate(hdx, hdx, robinhood),
  viaNttTemplate(hollar, hollar, robinhood),
  viaNttTemplate(spy, spy, robinhood),
  viaNttTemplate(weth_wh, eth, robinhood),
];

const toSolanaViaNtt: AssetRoute[] = [
  viaNttTemplate(sol, sol, solana),
  viaNttTemplate(jito_sol, jito_sol, solana),
  viaNttTemplate(prime, prime, solana),
];

const toSuiViaNtt: AssetRoute[] = [viaNttTemplate(sui, sui, sui_chain)];

// Executor-delivered counterparts of the ntt routes above, same pairs
const viaNttExecutor: AssetRoute[] = [
  viaNttExecutorTemplate(dai_wh, dai, ethereum),
  viaNttExecutorTemplate(susds_wh, susds, ethereum),
  viaNttExecutorTemplate(usdc_wh, usdc, ethereum),
  viaNttExecutorTemplate(usdt_wh, usdt, ethereum),
  viaNttExecutorTemplate(wbtc_wh, wbtc, ethereum),
  viaNttExecutorTemplate(weth_wh, eth, ethereum),
  viaNttExecutorTemplate(aave, aave, ethereum),
  viaNttExecutorTemplate(apyusd, apyusd, ethereum),
  viaNttExecutorTemplate(ena, ena, ethereum),
  viaNttExecutorTemplate(ldo, ldo, ethereum),
  viaNttExecutorTemplate(link, link, ethereum),
  viaNttExecutorTemplate(paxg, paxg, ethereum),
  viaNttExecutorTemplate(sky, sky, ethereum),
  viaNttExecutorTemplate(susde, susde, ethereum),
  viaNttExecutorTemplate(tbtc, tbtc, ethereum),
  viaNttExecutorTemplate(trac, trac, ethereum),
  viaNttExecutorTemplate(wsteth, wsteth, ethereum),
  viaNttExecutorTemplate(eurc_wh, eurc, base),
  viaNttExecutorTemplate(hype, hype, hyperevm),
  viaNttExecutorTemplate(hdx, hdx, robinhood),
  viaNttExecutorTemplate(hollar, hollar, robinhood),
  viaNttExecutorTemplate(spy, spy, robinhood),
  viaNttExecutorTemplate(weth_wh, eth, robinhood),
  viaNttExecutorTemplate(sol, wsol, solana),
  viaNttExecutorTemplate(jito_sol, jito_sol, solana),
  viaNttExecutorTemplate(prime, prime, solana),
  viaNttExecutorTemplate(sui, sui, sui_chain),
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
    ...toHyperevmViaNtt,
    ...toNearViaNtt,
    ...toZcashViaOmni,
    ...toRobinhoodViaNtt,
    ...toSolanaViaNtt,
    ...toSuiViaNtt,
    ...viaNttExecutor,
    ...toEnergywebx,
    ...toKusamaAssethub,
    ...toMythos,
    ...toNeuroweb,
    ...toPendulum,
    ...toUnique,
  ],
});
