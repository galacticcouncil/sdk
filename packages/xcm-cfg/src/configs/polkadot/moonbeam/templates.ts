import { Asset, AssetRoute } from '@galacticcouncil/xcm-core';

import { glmr } from '../../../assets';
import { BalanceBuilder, ContractBuilder } from '../../../builders';
import { hydration } from '../../../chains';

export function toHydrationErc20Template(
  asset: Asset,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().substrate().system().account(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  });
}
