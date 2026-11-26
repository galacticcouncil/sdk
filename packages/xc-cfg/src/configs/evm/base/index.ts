import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_wh, hollar, usdc } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaNttExecutorTemplate,
  toHydrationViaNttTemplate,
  toHydrationViaPsmTemplate,
} from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(eurc, eurc_wh),
];

const toHydrationViaNttExecutor: AssetRoute[] = [
  toHydrationViaNttExecutorTemplate(eurc, eurc_wh),
];

const toHydrationViaPsm: AssetRoute[] = [
  toHydrationViaPsmTemplate(usdc, hollar),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [
    ...toHydrationViaNtt,
    ...toHydrationViaNttExecutor,
    ...toHydrationViaPsm,
  ],
});
