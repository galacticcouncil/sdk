# Galactic SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk)

</p>
Hydration trade router & pool utilities.
<br />
<br />
Table of content:

- [Installation](#installation)
- [Components](#components)
  - [Router](#router)
  - [TradeRouter](#traderouter)
- [Examples](#examples)
- [Roadmap](#roadmap)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk`

### Troubleshooting

As of **v2.x** .wasm files are no longer embedded in bundle
but rather deferred to improve load performance & decrease
module size (esm only).

For more details visit [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Components

### Router

Off-chain routing, build to find the most suitable routes across the pools. Building block for TradeRouter.

#### API

```typescript
getPools(): PoolBase[]
getAllAssets(): Asset[]
getAssetPairs(token: string): Asset[]
getAllPaths(tokenIn: string, tokenOut: string): Hop[][]
```

### TradeRouter

Off-chain optimization of orders across pools for best price execution. TradeRouter does not perform any on-chain transations.

#### API

```typescript
getBestSpotPrice(tokenIn: string, tokenOut: string): Amount
getBestSell(tokenIn: string, tokenOut: string, amountIn: BigNumber | number | string): Trade
getBestBuy(tokenIn: string, tokenOut: string, amountOut: BigNumber | number | string): Trade
getBuy(tokenIn: string, tokenOut: string, amountOut: BigNumber | number | string, route?: Hop[]): Trade
getSell(tokenIn: string, tokenOut: string, amountIn: BigNumber | number | string, route?: Hop[]): Trade
```

For type signature visit [types.ts](src/types.ts)<br />

#### Usage

```typescript
// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TradeRouter, PoolService, PoolType } from '@galacticcouncil/sdk';

// Initialize Polkadot API
const wsProvider = new WsProvider('wss://rpc.hydradx.cloud');
const api = await ApiPromise.create({ provider: wsProvider });

// Initialize Trade Router
const poolService = new PoolService(api);
await poolService.syncRegistry(); // Wait until pools initialized (optional), fallback to lazy init
const tradeRouter = new TradeRouter(poolService);

// Sell 5 USDT(10) for HDX(0)
const trade = await tradeRouter.getBestSell('10', '0', '5');
// Human readable output
console.log(trade.toHuman());
// Build tx given the slippage amount
console.log(trade.toTx(amount));
```

## Examples

SDK Examples and testing helpers.

### Run

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.

To demonstrate full working examples on real chain see [script](test/script/examples) section.

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
