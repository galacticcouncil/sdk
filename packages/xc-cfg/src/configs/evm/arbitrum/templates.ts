import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import {
  BalanceBuilder,
  ContractBuilder,
  FeeAmountBuilder,
} from '../../../builders';
import { assetHub, ethereum, hydration } from '../../../chains';
import { Tag } from '../../../tags';

/**
 * Across V3 fast-fill on Ethereum → Snowbridge V2 inbound to AssetHub →
 * XCM InitiateTransfer to Hydration. End-to-end via Snowfork's deployed
 * `SnowbridgeL2Adaptor` on Arbitrum (0x836895ad176235dfe9c59b3df56c7579d90ea338).
 */
export function toHydrationViaAcrossSnowbridgeTemplate(
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
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .AcrossSnowbridge()
          .calculateFee({ hub: assetHub, ethereum }),
        asset: eth,
      },
    },
    contract: ContractBuilder()
      .Across()
      .Snowbridge()
      .sendTokenAndCall(),
    tags: [Tag.Across_Snowbridge],
  });
}

/**
 * Across V3 ETH/WETH path on Arbitrum: identical flow to the ERC20 template
 * but uses the L2 adaptor's `sendEtherAndCall` entrypoint — no Uniswap swap
 * leg because the multicall on Ethereum unwraps WETH directly to fund the
 * Snowbridge inbound fee.
 */
export function toHydrationViaAcrossSnowbridgeEtherTemplate(
  assetIn: Asset,
  assetOut: Asset
): AssetRoute {
  return new AssetRoute({
    source: {
      asset: assetIn,
      balance: BalanceBuilder().evm().native(),
      fee: {
        asset: eth,
        balance: BalanceBuilder().evm().native(),
      },
      destinationFee: {
        balance: BalanceBuilder().evm().native(),
      },
    },
    destination: {
      chain: hydration,
      asset: assetOut,
      fee: {
        amount: FeeAmountBuilder()
          .AcrossSnowbridge()
          .calculateFee({ hub: assetHub, ethereum }),
        asset: eth,
      },
    },
    contract: ContractBuilder()
      .Across()
      .Snowbridge()
      .sendEtherAndCall(),
    tags: [Tag.Across_Snowbridge],
  });
}
