import { Asset, AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { jito_sol, prime, sol } from '../../assets';
import { ProgramBuilder } from '../../builders';
import { hydration, solana } from '../../chains';
import { Tag } from '../../tags';

function toHydrationViaNttTemplate(asset: Asset): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: sol,
      },
    },
    destination: {
      chain: hydration,
      asset: asset,
      fee: {
        amount: 0,
        // Ntt delivers the full amount - nothing is taken on the far side.
        asset: asset,
      },
    },
    program: ProgramBuilder().Wormhole().Ntt().transfer(),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}

const toHydrationViaNtt: AssetRoute[] = [
  toHydrationViaNttTemplate(sol),
  toHydrationViaNttTemplate(jito_sol),
  toHydrationViaNttTemplate(prime),
];

export const solanaConfig = new ChainRoutes({
  chain: solana,
  routes: [...toHydrationViaNtt],
});
