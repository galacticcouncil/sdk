<h1><code>Galactic SDK</code></h1>
<p>
  <a href="https://badge.fury.io/js/@galacticcouncil%2Fsdk"><img src="https://badge.fury.io/js/@galacticcouncil%2Fsdk.svg" alt="npm version" height="18"></a>
</p>
Galactic SDK is collection of components crafted to ease Basilisk & HydraDX chains integration.
<br />
<br />
Table of content:

- [Installation](#installation)
- [Components](#components)
  - [TradeRouter](#traderouter)
  - [TradeExecutor](#tradeexecutor)
- [Examples](#examples)
- [Roadmap](#roadmap)
- [Issue reporting](#issue-reporting)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk`

## Components

### TradeRouter

Off-chain optimization of orders across pools for best price execution. Router does not perform any on-chain transations.

#### API

```typescript
getPools(): PoolBase[]
getAllAssets(): PoolAsset[]
getAssetPairs(token: string): PoolAsset[]
getAllPaths(tokenIn: string, tokenOut: string): Hop[][]
getBestSellPrice(tokenIn: string, tokenOut: string, amountIn: BigNumber): Swap[]
getBestBuyPrice(tokenIn: string, tokenOut: string, amountOut: BigNumber): Swap[]
```

For type signature visit [types.ts](src/types.ts)<br />

#### Usage

```typescript
// Import
import { ApiPromise, WsProvider } from '@polkadot/api';
import { TradeRouter, PolkadotPoolService } from '@galacticcouncil/sdk';

// Initialize Polkadot API
const wsProvider = new WsProvider('wss://rpc.basilisk.cloud');
const api = await ApiPromise.create({ provider: wsProvider });

// Initialize Router
const poolService = new PolkadotPoolService(api);
const tradeRouter = new TradeRouter(poolService);

// Do something
const result = await tradeRouter.getAllAssets();
console.log(result);
```

### TradeExecutor

On-chain transaction executor using data from router to perform best possible trade.

Not supported yet. 🛠

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

| Name          |  Type  |     |
| ------------- | :----: | --: |
| TradeRouter   |  API   |  🧪 |
| TradeExecutor |  API   |   🛠 |
| Polkadot      | Client |  🧪 |
| Capi          | Client |  ⏳ |
| XYK           |  Pool  |  🧪 |
| LBP           |  Pool  |  ⏳ |
| Stable        |  Pool  |  ⏳ |
| Omni          |  Pool  |  ⏳ |

## Issue reporting

In case of unexpected sdk behaviour, please create well-written issue [here](https://https://github.com/nohaapav/router-sdk/issues/new). It makes it easier to find & fix the problem accordingly.
