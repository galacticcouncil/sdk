import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import {
  aave,
  apyusd,
  dai,
  dai_wh,
  ena,
  eth,
  ldo,
  link,
  paxg,
  sky,
  susde,
  susds,
  susds_wh,
  tbtc,
  trac,
  usdc,
  usdc_wh,
  usdt,
  usdt_wh,
  wbtc,
  wbtc_wh,
  weth,
  weth_wh,
  wsteth,
} from '../../../assets';
import { ethereum } from '../../../chains';

import {
  toHydrationViaBasejumpTemplate,
  toHydrationViaNttExecutorNativeTemplate,
  toHydrationViaNttExecutorTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(dai, dai_wh),
  toHydrationViaNttTemplate(susds, susds_wh),
  toHydrationViaNttTemplate(usdc, usdc_wh),
  toHydrationViaNttTemplate(usdt, usdt_wh),
  toHydrationViaNttTemplate(wbtc, wbtc_wh),
  toHydrationViaNttTemplate(weth, weth_wh),
  toHydrationViaNttTemplate(eth, weth_wh),
  toHydrationViaNttTemplate(aave, aave),
  toHydrationViaNttTemplate(apyusd, apyusd),
  toHydrationViaNttTemplate(ena, ena),
  toHydrationViaNttTemplate(ldo, ldo),
  toHydrationViaNttTemplate(link, link),
  toHydrationViaNttTemplate(paxg, paxg),
  toHydrationViaNttTemplate(sky, sky),
  toHydrationViaNttTemplate(susde, susde),
  toHydrationViaNttTemplate(tbtc, tbtc),
  toHydrationViaNttTemplate(trac, trac),
  toHydrationViaNttTemplate(wsteth, wsteth),
];

const toHydrationViaNttExecutor: AssetRoute[] = [
  toHydrationViaNttExecutorTemplate(dai, dai_wh),
  toHydrationViaNttExecutorTemplate(susds, susds_wh),
  toHydrationViaNttExecutorTemplate(usdc, usdc_wh),
  toHydrationViaNttExecutorTemplate(usdt, usdt_wh),
  toHydrationViaNttExecutorTemplate(wbtc, wbtc_wh),
  toHydrationViaNttExecutorTemplate(weth, weth_wh),
  toHydrationViaNttExecutorNativeTemplate(eth, weth_wh),
  toHydrationViaNttExecutorTemplate(aave, aave),
  toHydrationViaNttExecutorTemplate(apyusd, apyusd),
  toHydrationViaNttExecutorTemplate(ena, ena),
  toHydrationViaNttExecutorTemplate(ldo, ldo),
  toHydrationViaNttExecutorTemplate(link, link),
  toHydrationViaNttExecutorTemplate(paxg, paxg),
  toHydrationViaNttExecutorTemplate(sky, sky),
  toHydrationViaNttExecutorTemplate(susde, susde),
  toHydrationViaNttExecutorTemplate(tbtc, tbtc),
  toHydrationViaNttExecutorTemplate(trac, trac),
  toHydrationViaNttExecutorTemplate(wsteth, wsteth),
];

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(usdc, usdc_wh),
];

export const ethereumConfig = new ChainRoutes({
  chain: ethereum,
  routes: [
    ...toHydrationViaNtt,
    ...toHydrationViaNttExecutor,
    ...toHydrationViaBasejump,
  ],
});
