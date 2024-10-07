import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { aca, dai_awh, glmr } from '../../assets';
import { hydration, moonbeam, acala_evm } from '../../chains';
import { BalanceBuilder, ContractBuilder } from '../../builders';

const toHydrationViaWormhole: AssetRoute[] = [
  new AssetRoute({
    source: {
      asset: dai_awh,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: aca,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: dai_awh,
      fee: {
        amount: 0.08,
        asset: glmr,
      },
    },
    contract: ContractBuilder().TokenBridge().transferTokensWithPayload().mrl(),
    via: {
      chain: moonbeam,
    },
  }),
];

export const acalaEvmConfig = new ChainRoutes({
  chain: acala_evm,
  routes: [...toHydrationViaWormhole],
});
