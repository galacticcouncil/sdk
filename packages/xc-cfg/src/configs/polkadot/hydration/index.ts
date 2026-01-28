import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  ajun,
  astr,
  bnc,
  cfg_new,
  cru,
  dai,
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
  ksm,
  laos,
  ldo,
  link,
  myth,
  neuro,
  paxg,
  pen,
  pink,
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
  astar,
  bifrost,
  crust,
  energywebx,
  ethereum,
  hydration,
  interlay,
  laos_chain,
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
  toHubExtTemplate,
  toHubWithCexFwdTemplate,
  toMoonbeamErc20Template,
  toTransferTemplate,
  viaSnowbridgeTemplate,
  viaWormholeRelayerTemplate,
  viaWormholeBridgeTemplate,
} from './templates';

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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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
        amount: FeeAmountBuilder().XcmPaymentApi().calculateDestFee(),
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

const toLaos: AssetRoute[] = [toTransferTemplate(laos, laos_chain)];

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
    ...toAjuna,
    ...toAssetHub,
    ...toAstar,
    ...toBifrost,
    ...toCex,
    ...toCrust,
    ...toEthereumViaSnowbridge,
    ...toEthereumViaWormhole,
    ...toInterlay,
    ...toLaos,
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
