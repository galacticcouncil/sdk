import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { eth, usdc, usdc_eth } from '../../../assets';
import { arbitrum } from '../../../chains';
import {
  toHydrationViaAcrossSnowbridgeEtherTemplate,
  toHydrationViaAcrossSnowbridgeTemplate,
} from './templates';

const toHydrationViaAcrossSnowbridge: AssetRoute[] = [
  toHydrationViaAcrossSnowbridgeTemplate(usdc, usdc_eth),
  toHydrationViaAcrossSnowbridgeEtherTemplate(eth, eth),
];

export const arbitrumConfig = new ChainRoutes({
  chain: arbitrum,
  routes: [...toHydrationViaAcrossSnowbridge],
});
