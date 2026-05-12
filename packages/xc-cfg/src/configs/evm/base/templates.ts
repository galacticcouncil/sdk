import { Asset, AssetRoute } from '@galacticcouncil/xc-core';

import { eth } from '../../../assets';
import { BalanceBuilder, ContractBuilder, FeeAmountBuilder } from '../../../builders';
import { assetHub, hydration, moonbeam } from '../../../chains';
import { Tag } from '../../../tags';

export function toHydrationViaWormholeTemplate(
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
    tags: [Tag.Mrl, Tag.Wormhole],
  });
}

export function toHydrationViaBasejumpTemplate(
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
        amount: FeeAmountBuilder().Basejump().quoteFee(),
        asset: assetIn,
      },
    },
    contract: ContractBuilder()
      .Basejump()
      .bridgeViaWormhole(),
    tags: [Tag.Basejump],
  });
}

/**
 * Across V3 fast-fill on Ethereum → Snowbridge V2 inbound to AssetHub →
 * XCM InitiateTransfer to Hydration. End-to-end via Snowfork's deployed
 * `SnowbridgeL2Adaptor` on Base (0x07fe4e7340976fc873b74bafe3c3e5b0e01f3665).
 *
 * Phase 0 — fee uses the existing Snowbridge inbound fee builder. A proper
 * Across-aware fee builder that adds the Across relayer fee (via
 * `@snowbridge/api/across.estimateFees`) lands with the XCM construction
 * follow-up referenced in `xc-cfg/builders/contracts/Across/Snowbridge.ts`.
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
          .Snowbridge()
          .calculateInboundFee({ hub: assetHub }),
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
 * Across V3 ETH/WETH path: identical to the ERC20 template but uses the
 * L2 adaptor's `sendEtherAndCall` entrypoint — no Uniswap swap leg needed
 * because the multicall on Ethereum unwraps WETH directly to fund the
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
          .Snowbridge()
          .calculateInboundFee({ hub: assetHub }),
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
