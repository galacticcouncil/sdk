import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_mwh } from '../../../assets';
import { base } from '../../../chains';
import { toHydrationViaBasejumpTemplate } from './templates';

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(eurc, eurc_mwh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaBasejump],
});
