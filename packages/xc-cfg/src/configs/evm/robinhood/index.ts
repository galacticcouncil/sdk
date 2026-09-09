import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eth, hdx, hollar, weth, weth_wh } from '../../../assets';
import { robinhood } from '../../../chains';
import {
  toHydrationViaNttExecutorNativeTemplate,
  toHydrationViaNttExecutorTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(hdx, hdx),
  toHydrationViaNttTemplate(hollar, hollar),
  toHydrationViaNttTemplate(weth, weth_wh),
  toHydrationViaNttTemplate(eth, weth_wh),
];

const toHydrationViaNttExecutor: AssetRoute[] = [
  toHydrationViaNttExecutorTemplate(hdx, hdx),
  toHydrationViaNttExecutorTemplate(hollar, hollar),
  toHydrationViaNttExecutorTemplate(weth, weth_wh),
  toHydrationViaNttExecutorNativeTemplate(eth, weth_wh),
];

export const robinhoodConfig = new ChainRoutes({
  chain: robinhood,
  routes: [...toHydrationViaNtt, ...toHydrationViaNttExecutor],
});
