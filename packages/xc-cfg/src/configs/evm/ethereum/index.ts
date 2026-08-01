import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  apyusd,
  cfg_new,
  dai,
  dai_wh,
  ena,
  eth,
  susds,
  susds_wh,
  usdc_wh,
  usdt_wh,
  wbtc,
  wbtc_wh,
  weth,
  weth_wh,
  usdc,
  usdc_eth,
  usdt,
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
} from '../../../assets';
import { assetHub, ethereum, hydration } from '../../../chains';
import { ContractBuilder, FeeAmountBuilder } from '../../../builders';
import { Tag } from '../../../tags';

import {
  toHydrationViaNttTemplate,
  toHydrationViaSnowbridgeTemplate,
  toHydrationViaSnowbridgeV1Template,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(dai, dai_wh),
  toHydrationViaNttTemplate(susds, susds_wh),
  toHydrationViaNttTemplate(usdc, usdc_wh),
  toHydrationViaNttTemplate(usdt, usdt_wh),
  toHydrationViaNttTemplate(wbtc, wbtc_wh),
  toHydrationViaNttTemplate(weth, weth_wh),
  toHydrationViaNttTemplate(eth, weth_wh),
];

const toHydrationViaSnowbridge: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eth,
      fee: {
        asset: eth,
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
      fee: {
        asset: eth,
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

export const ethereumConfig = new ChainRoutes({
  chain: ethereum,
  routes: [
    ...toHydrationViaNtt,
    ...toHydrationViaSnowbridge,
    ...toHydrationViaSnowbridgeV1,
  ],
});
