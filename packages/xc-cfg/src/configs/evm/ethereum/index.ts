import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  apyusd,
  cfg_new,
  dai,
  dai_mwh,
  ena,
  eth,
  susds_mwh,
  wbtc,
  wbtc_mwh,
  weth_mwh,
  usdc,
  usdc_mwh,
  usdc_eth,
  usdt,
  usdt_mwh,
  usdt_eth,
  aave,
  paxg,
  susde,
  tbtc,
  ldo,
  link,
  sky,
  trac,
  wsteth,
  lbtc,
  susds,
} from '../../../assets';
import { assetHub, ethereum, hydration, moonbeam } from '../../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../../builders';
import { Tag } from '../../../tags';

import {
  toHydrationViaWormholeTemplate,
  toHydrationViaSnowbridgeTemplate,
  toHydrationViaSnowbridgeV1Template,
} from './templates';

const toHydrationViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: weth_mwh,
      fee: {
        amount: 0,
        asset: weth_mwh,
      },
    },
    contract: ContractBuilder()
      .Wormhole()
      .TokenBridge()
      .wrapAndTransferETHWithPayload()
      .viaMrl({ moonchain: moonbeam }),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
  toHydrationViaWormholeTemplate(dai, dai_mwh),
  toHydrationViaWormholeTemplate(wbtc, wbtc_mwh),
  toHydrationViaWormholeTemplate(usdc, usdc_mwh),
  toHydrationViaWormholeTemplate(usdt, usdt_mwh),
  toHydrationViaWormholeTemplate(susds, susds_mwh),
];

const toHydrationViaSnowbridge: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: eth,
      fee: {
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateInboundFee({ hub: assetHub }),
        asset: eth,
      },
    },
    contract: ContractBuilder().Snowbridge().v2SendMessage(),
    tags: [Tag.Snowbridge],
  }),
  toHydrationViaSnowbridgeTemplate(aave, aave),
  toHydrationViaSnowbridgeTemplate(apyusd, apyusd),
  toHydrationViaSnowbridgeTemplate(cfg_new, cfg_new),
  toHydrationViaSnowbridgeTemplate(ena, ena),
  toHydrationViaSnowbridgeTemplate(paxg, paxg),
  toHydrationViaSnowbridgeTemplate(susde, susde),
  toHydrationViaSnowbridgeTemplate(tbtc, tbtc),
  toHydrationViaSnowbridgeTemplate(lbtc, lbtc),
  toHydrationViaSnowbridgeTemplate(ldo, ldo),
  toHydrationViaSnowbridgeTemplate(link, link),
  toHydrationViaSnowbridgeTemplate(sky, sky),
  toHydrationViaSnowbridgeTemplate(trac, trac),
  toHydrationViaSnowbridgeTemplate(wsteth, wsteth),
  toHydrationViaSnowbridgeTemplate(usdc, usdc_eth),
  toHydrationViaSnowbridgeTemplate(usdt, usdt_eth),
];

// Snowbridge V1 (legacy, cheaper) inbound routes. Registered after the V2
// routes so the default/`Snowbridge`-tag selection still resolves to V2; the
// V1 route is reached via the `SnowbridgeV1` tag from the UI switch.
const toHydrationViaSnowbridgeV1: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: eth,
      fee: {
        amount: FeeAmountBuilder()
          .Snowbridge()
          .calculateInboundFeeV1({ hub: assetHub }),
        asset: eth,
      },
    },
    contract: ContractBuilder().Snowbridge().sendToken(),
    tags: [Tag.Snowbridge, Tag.SnowbridgeV1],
  }),
  toHydrationViaSnowbridgeV1Template(aave, aave),
  toHydrationViaSnowbridgeV1Template(apyusd, apyusd),
  toHydrationViaSnowbridgeV1Template(cfg_new, cfg_new),
  toHydrationViaSnowbridgeV1Template(ena, ena),
  toHydrationViaSnowbridgeV1Template(paxg, paxg),
  toHydrationViaSnowbridgeV1Template(susde, susde),
  toHydrationViaSnowbridgeV1Template(tbtc, tbtc),
  toHydrationViaSnowbridgeV1Template(lbtc, lbtc),
  toHydrationViaSnowbridgeV1Template(ldo, ldo),
  toHydrationViaSnowbridgeV1Template(link, link),
  toHydrationViaSnowbridgeV1Template(sky, sky),
  toHydrationViaSnowbridgeV1Template(trac, trac),
  toHydrationViaSnowbridgeV1Template(wsteth, wsteth),
  toHydrationViaSnowbridgeV1Template(usdc, usdc_eth),
  toHydrationViaSnowbridgeV1Template(usdt, usdt_eth),
];

const toMoonbeamViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      balance: BalanceBuilder().evm().native(),
      destinationFee: {
        asset: eth,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: weth_mwh,
      fee: {
        amount: 0,
        asset: weth_mwh,
      },
    },
    contract: ContractBuilder().Wormhole().TokenBridge().wrapAndTransferETH(),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
  new AssetRoute({
    source: {
      asset: dai,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        asset: dai,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: moonbeam,
      asset: dai_mwh,
      fee: {
        amount: 0,
        asset: dai_mwh,
      },
    },
    contract: ContractBuilder().Wormhole().TokenBridge().transferTokens(),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
];

export const ethereumConfig = new ChainRoutes({
  chain: ethereum,
  routes: [
    ...toHydrationViaWormhole,
    ...toHydrationViaSnowbridge,
    ...toHydrationViaSnowbridgeV1,
  ],
});
