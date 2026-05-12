import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_mwh, usdc, usdc_eth } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaAcrossSnowbridgeTemplate,
  toHydrationViaBasejumpTemplate,
  toHydrationViaWormholeTemplate,
} from './templates';

const toHydrationViaWormhole: AssetRoute[] = [
  toHydrationViaWormholeTemplate(eurc, eurc_mwh),
];

const toHydrationViaBasejump: AssetRoute[] = [
  toHydrationViaBasejumpTemplate(eurc, eurc_mwh),
];

const toHydrationViaAcrossSnowbridge: AssetRoute[] = [
  toHydrationViaAcrossSnowbridgeTemplate(usdc, usdc_eth),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [
    ...toHydrationViaWormhole,
    ...toHydrationViaBasejump,
    ...toHydrationViaAcrossSnowbridge,
  ],
});
