import { Asset, AssetRoute } from '@galacticcouncil/xcm-core';

import { eth } from '../../assets';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../builders';
import { hydration, moonbeam } from '../../chains';

export function toHydrationErc20Template(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        asset: assetIn,
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: 0,
        asset: assetOut,
      },
    },
    contract: ContractBuilder()
      .Wormhole()
      .TokenBridge()
      .transferTokensWithPayload()
      .viaMrl({ moonchain: moonbeam }),
  });
}

export function toHydrationSnowbridgeTemplate(assetIn: Asset, assetOut: Asset) {
  return new AssetRoute({
    source: {
      asset: assetIn,
      balance: BalanceBuilder().evm().erc20(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().erc20(),
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder().Snowbridge().quoteSendTokenFee(),
        asset: eth,
      },
    },
    contract: ContractBuilder().Snowbridge().sendToken(),
  });
}
