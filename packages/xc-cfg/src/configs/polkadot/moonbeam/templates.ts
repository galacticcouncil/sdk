import { AnyChain, Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { glmr } from '../../../assets';
import { BalanceBuilder, ContractBuilder } from '../../../builders';
import { hydration } from '../../../chains';

function toErc20Template(
  asset: Asset,
  destination: AnyChain,
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
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  });
}

function toXcTemplate(
  asset: Asset,
  destination: AnyChain,
  destinationFee: number
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: asset,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: glmr,
        balance: BalanceBuilder().evm().erc20(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: destination,
      asset: asset,
      fee: {
        amount: destinationFee,
        asset: asset,
      },
    },
    contract: ContractBuilder().Xtokens().transfer(),
  });
}

export function toHydrationErc20Template(
  asset: Asset,
  destinationFee: number
): AssetRoute {
  return toErc20Template(asset, hydration, destinationFee);
}

export function toHydrationXcTemplate(
  asset: Asset,
  destinationFee: number
): AssetRoute {
  return toXcTemplate(asset, hydration, destinationFee);
}
