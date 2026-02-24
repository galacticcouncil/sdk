import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { eurc, eurc_mwh, eth } from '../../assets';
import { base, hydration, moonbeam } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';
import { Tag } from '../../tags';

const toHydrationViaWormholeMrl: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: eurc,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        asset: eurc,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: eurc_mwh,
      fee: {
        amount: 0,
        asset: eurc_mwh,
      },
    },
    contract: ContractBuilder()
      .Wormhole()
      .TokenBridge()
      .transferTokensWithPayload()
      .viaMrl({ moonchain: moonbeam }),
    tags: [Tag.Mrl, Tag.Wormhole],
  }),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaWormholeMrl],
});
