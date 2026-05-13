import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eth, usdc, usdc_eth } from '../../../assets';
import { optimism } from '../../../chains';
import {
  toHydrationViaAcrossSnowbridgeEtherTemplate,
  toHydrationViaAcrossSnowbridgeTemplate,
} from './templates';

const toHydrationViaAcrossSnowbridge: AssetRoute[] = [
  toHydrationViaAcrossSnowbridgeTemplate(usdc, usdc_eth),
  toHydrationViaAcrossSnowbridgeEtherTemplate(eth, eth),
];

export const optimismConfig = new ChainRoutes({
  chain: optimism,
  routes: [...toHydrationViaAcrossSnowbridge],
});
