import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_mwh } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaBasejumpTemplate,
  toHydrationViaNttTemplate,
} from './templates';

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(eurc, eurc_mwh),
];

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(eurc, eurc_mwh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaNtt, ...toHydrationViaBasejump],
});
