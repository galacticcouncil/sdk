import { AssetRoute, ChainRoutes } from '@galacticcouncil/xcm-core';

import { aca, dai_awh } from '../../assets';
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
        asset: dai_awh,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: dai_awh,
      fee: {
        amount: 0,
        asset: dai_awh,
      },
    },
    contract: ContractBuilder()
      .TokenBridge()
      .transferTokensWithPayload()
      .viaMrl({ moonchain: moonbeam }),
  }),
];

export const acalaEvmConfig = new ChainRoutes({
  chain: acala_evm,
  routes: [...toHydrationViaWormhole],
});
