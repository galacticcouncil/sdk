import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_wh } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaBasejumpTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(eurc, eurc_wh),
];

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(eurc, eurc_wh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaNtt, ...toHydrationViaBasejump],
});
