import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { eurc, eth, usdc } from '../../assets';
import { base, hydration } from '../../chains';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../builders';
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
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: eurc,
      fee: {
        amount: FeeAmountBuilder().Hyperbridge().calculateNativeFee(),
        asset: eth,
      },
    },
    contract: ContractBuilder()
      .Hyperbridge()
      .teleport({ custodialChain: base }),
    tags: [Tag.Hyperbridge],
  }),
];

export const baseConfig = new ChainRoutes({
  chain: base,
  routes: [...toHydrationViaHyperbridge],
});
