import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { near, wnear, zec } from '../../assets';
import { near_chain } from '../../chains';
import { toHydrationViaNttTemplate } from './templates';

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(near, near),
  toHydrationViaNttTemplate(wnear, near),
  toHydrationViaNttTemplate(zec, zec),
];

export const nearConfig = new ChainRoutes({
  chain: near_chain,
  routes: [...toHydrationViaNtt],
});
