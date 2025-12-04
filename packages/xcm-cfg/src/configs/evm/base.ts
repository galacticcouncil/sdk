import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { eurc, eth } from '../../assets';
import { base, hydration } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';
import { Tag } from '../../tags';

const toHydrationViaHyperbridge: AssetRoute[] = [
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
      asset: eurc,
      fee: {
        amount: 0,
        asset: eurc,
      },
    },
    contract: ContractBuilder().Hyperbridge().teleport(),
    tags: [Tag.Hyperbridge],
  }),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaHyperbridge],
});
