# Galactic SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk)

Hydration SDK built on top of [@polkadot{.js} (Pjs)](https://polkadot.js.org/).

Table of contents:

- [Installation](#installation)
- [Troubleshooting](#troubleshooting)
- [Usage](#usage)
- [Components](#components)
  - [api](#api)
  - [client](#client)
  - [ctx](#ctx)
  - [tx](#tx)
- [API Reference](#api-reference)
  - [AaveUtils](#aaveutils)
  - [TradeRouter](#traderouter)
  - [TradeScheduler](#tradescheduler)
  - [BalanceClient](#balanceclient)
  - [AssetClient](#assetclient)
- [Examples](#examples)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk`

## Troubleshooting

### Version 8.x

⚠️ **Important:** In the 8.x release, we upgraded `@polkadot/api` to version **16.x**. 

See the [changelog](https://github.com/galacticcouncil/sdk/blob/master/packages/sdk/CHANGELOG.md#800) for details.

### Version 2.x

As of **v2.x** .wasm files are no longer embedded in bundle
but rather deferred to improve load performance & decrease
module size (esm only).

For more details visit [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Usage

Use `createSdkContext` to quickly set up all components of the SDK — pool context, trading logic, client access, and transaction building — in a single call.

```ts
import { createSdkContext } from '@galacticcouncil/sdk';
import { ApiPromise, WsProvider } from '@polkadot/api';

const ws = 'wss://hydration-rpc.n.dwellir.com';
const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);

const api = await ApiPromise.create({
  provider: wsProvider,
});

const sdk = await createSdkContext(api);

// Don't forget to cleanup resources when DONE
sdk.destroy();
api.disconnect();
```

It handles all necessary setup under the hood. Just plug in your ApiPromise, and you're ready to interact with registry, accounts, pools, router, and more.

⚠️ **Note:** Make sure to keep only single instance of context per session.

## Components

### `api`

- `aave: AaveUtils` — Aave-related utilities.
- `router: TradeRouter` — Off-chain optimization of trades across pools for best price execution.
- `scheduler: TradeScheduler` — Trade orders scheduling.

### `client`

- `asset: AssetClient` — Registry metadata and lookup.
- `balance: BalanceClient` — Account balance tracking.
- `evm: EvmClient` — Interacts with EVM.

### `ctx`

- `pool: PoolService` — Internal stateful pool context. Initialized with support for:
  - Aave
  - Omnipool
  - Stableswap
  - XYK pools
  - LBP pools

### `tx`

- `TxBuilderFactory` — Factory for generating submittable transaction using fluent APIs.

### `destroy()`

Gracefully cleans up SDK resources. Always call before exiting to avoid memory leaks or stale subscriptions.

## API Reference

### AaveUtils

| Method | Description  |
| :----- | :----------- |
| `getSummary(user: string): AaveSummary` | Returns market summary. |
| `getHealthFactor(user: string): number` | Calculate HF. |
| `getHealthFactorAfterWithdraw(user: string, reserve:string, withdrawAmount: string): number` | Calculate HF after withdraw. |
| `getHealthFactorAfterSupply(user: string, reserve:string, supplyAmount: string): number` | Calculate HF after supply. |
| `getMaxWithdraw(user: string, reserve:string): Amount` | Get max possible safe withdraw. |

➡️ For type definitions visit [types.ts](src/aave/types.ts)<br />

### TradeRouter

| Method | Description  |
| :----- | :----------- |
| `getPools(): PoolBase[]` | Returns the current list of available pools. |
| `getAllPaths(tokenIn: string, tokenOut: string): Hop[][]` | Computes possible routes between two assets. |
| `getAllAssets(): PoolBase[]` | Lists all assets that are tradeable through the router. |
| `getAssetPairs(token: string): Asset[]` | Lists all assets given token is tradeable with. |
| `getBestSell(tokenIn: string, tokenOut: string, amountIn: bigint \| string): Trade` | Find the best sell trade for given input amount. |
| `getBestBuy(tokenIn: string, tokenOut: string, amountOut: bigint \| string): Trade` | Find the best buy trade for given output amount. |
| `getBuy(tokenIn: string, tokenOut: string, amountOut: bigint \| string, route?: Hop[]): Trade` | Calculate a buy using a specific route (optional). |
| `getSell(tokenIn: string, tokenOut: string, amountIn: bigint \| string, route?: Hop[]): Trade` | Calculate a sell using a specific route (optional). |
| `getBestSpotPrice(tokenIn: string, tokenOut: string): Amount` | Get the current spot price between two tokens. |
| `getMostLiquidRoute(tokenIn: string, tokenOut: string): Hop[]` | Find the route with the highest liquidity between two tokens. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

### TradeScheduler

| Method | Description  |
| :----- | :----------- |
| `getDcaOrder(assetIn: string, assetOut: string, amountInTotal: string, duration: number): TradeDcaOrder` | Calculate DCA order. |
| `getTwapBuyOrder(assetIn: string, assetOut: string, amountInTotal: string): TradeOrder` | Calculate TWAP buy order. |
| `getTwapSellOrder(assetIn: string, assetOut: string, amountInTotal: string): TradeOrder` | Calculate TWAP sell order. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

### AssetClient

| Method | Description  |
| :----- | :----------- |
| `getOnChainAssets(includeInvalid?: boolean, external?: ExternalAsset[]): Promise<Asset[]>` | Returns assets with metadata from registry. |

➡️ For type definitions visit [types.ts](src/types.ts)<br />

## Examples

All examples assume SDK has been initialized, [see](#usage)

### TradeRouter

Calculate sell of 1 DOT for HDX & build tx with 5% slippage (default to 1% if not specified)

```typescript
const { api, tx } = sdk;

const trade = await api.router.getBestSell("5", "10", "10");
const tradeTx = await tx.trade(trade)
  .withBeneficiary(BENEFICIARY)
  .withSlippage(5)
  .build();
console.log(trade.toHuman());
console.log('Transaction hash:', tradeTx.hex);
```

### AssetClient

Get default on-chain data.

```typescript
const { client } = sdk;

const assets = await client.asset.getOnChainAssets();
console.log(assets);
```

To demonstrate more full working examples on real chain see [script](test/script/examples) section.

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.