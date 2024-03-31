# Galactic SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk)

</p>
HydraDX trade router & pool utilities.
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

⚠️ **Breaking change (ESM Only)**

If you upgrading from **v1.x** to **v2.x** make sure hydradx wasm
files from npm package are included in project root. Those are not
longer embeddded in bundle itself but rather deferred to improve
load & performance of SDK. 

For more details visit [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

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
const tradeRouter = new TradeRouter(poolService);

// Do something
const result = await tradeRouter.getAllAssets();
console.log(result);
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
| Router      | API  |  🧪 |
| TradeRouter | API  |  🧪 |
| XYK         | Math |  🧪 |
| XYK         | Pool |  🧪 |
| Omni        | Math |  🧪 |
| Omni        | Pool |  🧪 |
| LBP         | Math |  🧪 |
| LBP         | Pool |  🧪 |
| Stable      | Math |  🧪 |
| Stable      | Pool |  🧪 |
