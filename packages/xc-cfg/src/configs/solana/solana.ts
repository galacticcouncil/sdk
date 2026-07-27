import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { solana } from '../../chains';

// NTT (Native Token Transfers) routes are registered here once
// per-token manager deployments land on Solana.
const toHydrationViaNtt: AssetRoute[] = [];

export const solanaConfig = new ChainRoutes({
  chain: solana,
  routes: [...toHydrationViaNtt],
});
