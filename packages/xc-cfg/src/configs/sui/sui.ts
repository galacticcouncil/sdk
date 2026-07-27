import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { sui_chain } from '../../chains';

// NTT (Native Token Transfers) routes are registered here once
// per-token manager deployments land on Sui.
const toHydrationViaNtt: AssetRoute[] = [];

export const suiConfig = new ChainRoutes({
  chain: sui_chain,
  routes: [...toHydrationViaNtt],
});
