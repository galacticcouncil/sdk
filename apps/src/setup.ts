import {
  assetsMap,
  chainsMap,
  routesMap,
  HydrationConfigService,
} from '@galacticcouncil/xc-cfg';

export const config = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});
