import { AssetRoute, ChainRoutes } from '@galacticcouncil/xc-core';

import { zec } from '../../assets';
import { DepositBuilder } from '../../builders';
import { hydration, near_chain, zcash } from '../../chains';
import { Tag } from '../../tags';

// Over NEAR: Omni mints into the ntt manager, which publishes to Hydration
const toHydrationViaOmni: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: zec,
      fee: {
        asset: zec,
      },
    },
    destination: {
      chain: hydration,
      asset: zec,
      fee: {
        amount: 0,
        asset: zec,
      },
    },
    deposit: DepositBuilder().Omni().Ntt().transfer(near_chain),
    tags: [Tag.Omni, Tag.Wormhole, Tag.Ntt],
  }),
];

export const zcashConfig = new ChainRoutes({
  chain: zcash,
  routes: [...toHydrationViaOmni],
});
