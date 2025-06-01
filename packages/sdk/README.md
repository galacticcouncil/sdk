# Galactic SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk)

Hydration sdk build on top of [@polkadot{.js} (Pjs)](https://polkadot.js.org/).

Table of content:

- [Installation](#installation)
- [Troubleshooting](#troubleshooting)
- [Usage](#usage)
  - [PoolService](#poolservice)
  - [Router](#router)
  - [TradeRouter](#traderouter)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk`

## Troubleshooting

As of **v2.x** .wasm files are no longer embedded in bundle
but rather deferred to improve load performance & decrease
module size (esm only).

For more details visit [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Usage

⚠️ Important: In the 8.x release, we upgraded `@polkadot/api` to version **16.x**.

> 🐛 **Note:** A **TTL-based LRU cache** was introduced starting from
`@polkadot/api` **v14.1.1**, which can break router behavior if not
addressed (eviction issue).

- 📄 [Release notes – v14.1.1](https://github.com/polkadot-js/api/releases/tag/v14.1.1)  
- 🐞 [GitHub Issue #6154](https://github.com/polkadot-js/api/issues/6154)
- 🐞 [GitHub Issue #6122](https://github.com/polkadot-js/api/issues/6122)

To ensure the router works as expected, **either**:

1. Use a custom `WsProvider` configuration with cache TTL at least 10 minutes
2. Use a custom `WsProvider` configuration with cache TTL disabled (null)

```typescript
const wsProvider = new WsProvider(
  ws,
  2_500, // autoConnect (2.5 seconds)
  {}, // headers
  60_000, // request timeout  (60 seconds)
  102400, // cache capacity
  10 * 60_000 // cache TTL (10 minutes)
);
```

### PoolService

Build and subscribe to the given AMM types, supplying data for the Router API.

⚠️ **Note:** Make sure to keep only single instance of service per session.

#### API Reference (internal)

| Method | Description  |
| :----- | :----------- |
| `getPools(): Promise<PoolBase[]>` | Returns list of available pools. |
| `getPoolFees(pool: PoolBase, feeAsset: string): Promise<PoolFees>` | Returns current pool fees |

➡️ For type definitions visit [types.ts](src/pool/types.ts)<br />

#### Example

Initialize pool context and sync registry.

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TradeRouter, PoolService, PoolType } from '@galacticcouncil/sdk';

const ws = 'wss://hydration-rpc.n.dwellir.com';
const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
const api = await ApiPromise.create({ provider: wsProvider });

const poolService = new PoolService(api);
await poolService.syncRegistry();

// Don't forget to cleanup the resources
poolService.destroy();
api.disconnect();
```

### Router

Off-chain routing, build to find the most suitable routes across the pools. Building block for `TradeRouter`.

#### API Reference

| Method | Description  |
| :----- | :----------- |
| `getPools(): PoolBase[]` | Returns the current list of available pools. |
| `getAllPaths(tokenIn: string, tokenOut: string): Hop[][]` | Computes possible routes between two assets. |
| `getAllAssets(): PoolBase[]` | Lists all assets that are tradeable through the router. |
| `getAssetPairs(token: string): Asset[]` | Lists all assets given token is tradeable with. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

#### Example

List all tradable assets available in the current pool context.

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TradeRouter, PoolService, PoolType } from '@galacticcouncil/sdk';

const ws = 'wss://hydration-rpc.n.dwellir.com';
const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
const api = await ApiPromise.create({ provider: wsProvider });

const poolService = new PoolService(api);
const router = new Router(poolService);

const assets = await router.getAllAssets();
console.log(assets);

// Don't forget to cleanup the resources
poolService.destroy();
api.disconnect();
```

### TradeRouter

Off-chain optimization of orders across pools for best price execution. TradeRouter does not perform any on-chain transations.

#### Api Reference

| Method | Description  |
| :----- | :----------- |
| `getBestSell(tokenIn: string, tokenOut: string, amountIn: bigint \| string): Trade` | Find the best sell trade for given input amount. |
| `getBestBuy(tokenIn: string, tokenOut: string, amountOut: bigint \| string): Trade` | Find the best buy trade for given output amount. |
| `getBuy(tokenIn: string, tokenOut: string, amountOut: bigint \| string, route?: Hop[]): Trade` | Calculate a buy using a specific route (optional). |
| `getSell(tokenIn: string, tokenOut: string, amountIn: bigint \| string, route?: Hop[]): Trade` | Calculate a sell using a specific route (optional). |
| `getSpotPrice(tokenIn: string, tokenOut: string): Amount` | Get the current spot price between two tokens. |
| `getMostLiquidRoute(tokenIn: string, tokenOut: string): Hop[]` | Find the route with the highest liquidity between two tokens. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

#### Example

Calculate sell of 1 DOT for HDX & build tx with 5% slippage (default to 1% if not specified)

```typescript
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TradeRouter, PoolService, PoolType } from '@galacticcouncil/sdk';

const ws = 'wss://hydration-rpc.n.dwellir.com';
const wsProvider = new WsProvider(ws, 2_500, {}, 60_000, 102400, 10 * 60_000);
const api = await ApiPromise.create({ provider: wsProvider });

const poolService = new PoolService(api);
const txUtils = new TradeUtils(api);

const router = new TradeRouter(poolService);

const sell = await router.getBestSell("5", "0", "1");
const tx = await utils.buildSellTx(sell, 5);
console.log(sell.toHuman());
console.log('Transaction hash: ' + transaction.hex);

// Don't forget to cleanup the resources
poolService.destroy();
api.disconnect();
```

## Examples

To demonstrate more full working examples on real chain see [script](test/script/examples) section.

### Execution

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.

## Roadmap

Component list and current status ⬇️

- 🧪 Done
- 🛠 Work in progress
- ⏳ Planning to build

| Name        | Type |     |
| ----------- | :--: | --: |
| Dca         | API  |  ⏳ |
| Router      | API  |  🧪 |
| TradeRouter | API  |  🧪 |
| Twap        | API  |  ⏳ |
| LBP         | Math |  🧪 |
| LBP         | Pool |  🧪 |
| Omni        | Math |  🧪 |
| Omni        | Pool |  🧪 |
| Stable      | Math |  🧪 |
| Stable      | Pool |  🧪 |
| XYK         | Math |  🧪 |
| XYK         | Pool |  🧪 |
| Aave        | Pool |  🧪 |
