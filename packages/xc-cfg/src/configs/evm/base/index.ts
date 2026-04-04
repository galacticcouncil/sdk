import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_mwh } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaBasejumpTemplate,
  toHydrationViaWormholeTemplate,
} from './templates';

const toHydrationViaWormhole: AssetRoute[] = [
  toHydrationViaWormholeTemplate(eurc, eurc_mwh),
];

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(eurc, eurc_mwh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaWormhole, ...toHydrationViaBasejump],
});
