import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eurc, eurc_mwh } from '../../../assets';
import { base } from '../../../chains';
import {
  toHydrationViaInstaBridgeTemplate,
  toHydrationViaWormholeTemplate,
} from './templates';

const toHydrationViaWormhole: AssetRoute[] = [
  toHydrationViaWormholeTemplate(eurc, eurc_mwh),
];

const toHydrationViaInstaBridge: AssetRoute[] = [
  toHydrationViaInstaBridgeTemplate(eurc, eurc_mwh),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaWormhole, ...toHydrationViaInstaBridge],
});
