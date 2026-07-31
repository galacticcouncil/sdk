import { Asset, AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { sui } from '../../assets';
import { MoveBuilder } from '../../builders';
import { hydration, sui_chain } from '../../chains';
import { Tag } from '../../tags';

function toHydrationViaNttTemplate(asset: Asset): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      fee: {
        asset: sui,
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
    move: MoveBuilder().Wormhole().Ntt().transfer(),
    tags: [Tag.Wormhole, Tag.Ntt],
  });
}

const toHydrationViaNtt: AssetRoute[] = [toHydrationViaNttTemplate(sui)];

export const suiConfig = new ChainRoutes({
  chain: sui_chain,
  routes: [...toHydrationViaNtt],
});
