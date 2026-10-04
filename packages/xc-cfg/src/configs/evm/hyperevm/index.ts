import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { hype, whype } from '../../../assets';
import { hyperevm } from '../../../chains';
import {
  toHydrationViaNttExecutorNativeTemplate,
  toHydrationViaNttExecutorTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(hype, hype),
  toHydrationViaNttTemplate(whype, hype),
];

const toHydrationViaNttExecutor: AssetRoute[] = [
  toHydrationViaNttExecutorNativeTemplate(hype, hype),
  toHydrationViaNttExecutorTemplate(whype, hype),
];

export const hyperevmConfig = new ChainRoutes({
  chain: hyperevm,
  routes: [...toHydrationViaNtt, ...toHydrationViaNttExecutor],
});
