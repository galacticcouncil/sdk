import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_wh } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaNttExecutorTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(eurc, eurc_wh),
];

const toHydrationViaNttExecutor: AssetRoute[] = [
  toHydrationViaNttExecutorTemplate(eurc, eurc_wh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaNtt, ...toHydrationViaNttExecutor],
});
