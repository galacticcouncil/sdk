# Galactic SDK Next

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk-next.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk-next)

Next gen sdk build on top of Polkadot API (Papi).

<br />
<br />
Table of content:

- [Installation](#installation)
- [Components](#components)
  - [PoolContextProvider](#poolcontextprovider)
  - [Router](#router)
  - [TradeRouter](#traderouter)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk-next`

## Components

### Pool

#### PoolContextProvider

Builds and maintains the pool context, handling subscriptions to pool changes.

##### Usage

Subscribe to desired AMMs. Only one `ctx` instance should exist!

```typescript
import { api, pool } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://rpc.hydradx.cloud');
const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

const pools = await ctx.getPools();
console.log(pools);

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

➡️ For type definitions visit [types.ts](src/pool/types.ts)<br />

### SOR

#### Router

Off-chain routing, build to find the most suitable routes across the pools. Building block for `TradeRouter`.

##### API Reference

| Method | Description |
| :----- | :----------- |
| `getPools(): PoolBase[]` | Returns the current list of available pools. |
| `getRoutes(assetIn: number, assetOut: number): Hop[][]` | Computes possible routes between two assets. |
| `getTradeableAssets(): number[]` | Lists all assets that are tradeable through the router. |

#### TradeRouter

Off-chain optimization of orders across pools for best price execution. TradeRouter does not perform any on-chain transations.

##### API Reference

| Method | Description |
| :----- | :----------- |
| `getBestSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string): Trade` | Find the best sell trade for given input amount. |
| `getBestBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string): Trade` | Find the best buy trade for given output amount. |
| `getBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string, route?: Hop[]): Trade` | Execute a buy using a specified route (optional). |
| `getSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string, route?: Hop[]): Trade` | Execute a sell using a specified route (optional). |
| `getSpotPrice(tokenIn: number, tokenOut: number): Amount` | Get the current spot price between two tokens. |
| `getMostLiquidRoute(tokenIn: number, tokenOut: number): Hop[]` | Find the route with the highest liquidity between two tokens. |

##### Usage

Calculate sell of 1 DOT for HDX. For convenience, the router amount can be specified either as a native bigint or as a human-readable string.

For example, `"1"` DOT (string) is equivalent to `10_000_000_000n` (bigint), as DOT has 10 decimals.

```typescript
import { api, pool, sor } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://rpc.hydradx.cloud');
const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

const router = new sor.TradeRouter(ctx);
const utils = new sor.TradeUtils(client);

const sell = await router.getBestSell(5, 0, 10_000_000_000n);
const tx = await utils.buildSellTx(sell);
console.log(sell.toHuman());
console.log('Transaction hash: ' + tx.asHex());

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

### Client

#### BalanceClient

Subscribe to the balance of the Hydration account.

```typescript
import { api, client as c } from '@galacticcouncil/sdk-next';

const omnipoolAddress = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"

const client = await api.getWs('wss://rpc.hydradx.cloud');
const balanceClient = new c.BalanceClient(client);
const observable = balanceClient.subscribeBalance(omnipoolAddress);
const balances = firstValueFrom(observable);
console.log(balances);

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

## Examples

SDK Examples and testing helpers.

### Run

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.

To demonstrate full working examples on real chain see [script](test/script/examples) section.
