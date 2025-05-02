# Galactic SDK Next

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk-next.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk-next)

Next gen hydration sdk build on top of [Polkadot API (Papi)](https://papi.how/).

Table of content:

- [Installation](#installation)
- [Usage](#usage)
  - [PoolContextProvider](#poolcontextprovider)
  - [Router](#router)
  - [TradeRouter](#traderouter)
  - [BalanceClient](#balanceclient)
  - [AssetClient](#assetclient)

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/sdk-next`

## Usage

### PoolContextProvider

Build and subscribe to the given AMM types, supplying data for the Router API.

⚠️ **Note:** Make sure to keep only single instance of context per session.

#### API Reference (internal)

| Method | Description |
| :----- | :----------- |
| `getPools(): Promise<PoolBase[]>` | Returns list of available pools. |
| `getPoolFees(pool: PoolBase, feeAsset: number): Promise<PoolFees>` | Returns current pool fees |

➡️ For type definitions visit [types.ts](src/pool/types.ts)<br />

#### Example

Initialize pool context supporting Omnipool, Stableswap & XYK pools.

```typescript
import { api, pool, sor } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://hydradx-rpc.dwellir.com');

const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

### Router

Off-chain routing, build to find the most suitable routes across the pools. Building block for `TradeRouter`.

#### API Reference

| Method | Description |
| :----- | :----------- |
| `getPools(): PoolBase[]` | Returns the current list of available pools. |
| `getRoutes(assetIn: number, assetOut: number): Hop[][]` | Computes possible routes between two assets. |
| `getTradeableAssets(): number[]` | Lists all assets that are tradeable through the router. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

#### Example

List all tradable assets available in the current pool context.

```typescript
import { api, pool, sor } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://hydradx-rpc.dwellir.com');

// Make sure to keep only single instance of context per session
const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

const router = new sor.Router(ctx);

const assets = await router.getTradeableAssets();
console.log(assets);

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

### TradeRouter

Off-chain optimization of orders across pools for best price execution. TradeRouter does not perform any on-chain transations.

#### Api Reference

| Method | Description |
| :----- | :----------- |
| `getBestSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string): Trade` | Find the best sell trade for given input amount. |
| `getBestBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string): Trade` | Find the best buy trade for given output amount. |
| `getBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string, route?: Hop[]): Trade` | Calculate a buy using a specific route (optional). |
| `getSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string, route?: Hop[]): Trade` | Calculate a sell using a specific route (optional). |
| `getSpotPrice(tokenIn: number, tokenOut: number): Amount` | Get the current spot price between two tokens. |
| `getMostLiquidRoute(tokenIn: number, tokenOut: number): Hop[]` | Find the route with the highest liquidity between two tokens. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

#### Example

Calculate sell of 1 DOT for HDX & build tx with 5% slippage (default to 1% if not specified)

```typescript
import { api, pool, sor } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://hydradx-rpc.dwellir.com');

const ctx = new pool.PoolContextProvider(client)
  .withOmnipool()
  .withStableswap()
  .withXyk();

const router = new sor.TradeRouter(ctx);
const utils = new sor.TradeUtils(client);

const sell = await router.getBestSell(5, 0, 10_000_000_000n);
const tx = await utils.buildSellTx(sell, 5);
console.log(sell.toHuman());
console.log('Transaction hash:', tx.asHex());

// Don't forget to cleanup the resources
ctx.destroy();
client.destroy();
```

**Note:** For convenience, the router amount can be specified either as a native bigint or as a human-readable string.

For example, `"1"` DOT (string) is equivalent to `10_000_000_000n` (bigint), as DOT has 10 decimals.

### BalanceClient

Helper class supporting the following standards:

- "Native assets"
- "Token assets"
- "ERC-20 tokens"

#### API Reference

| Method | Description |
| :----- | :----------- |
| `subscribeSystemBalance(address: string): Observable<AssetAmount>` | Subscribe native account balance. |
| `subscribeTokenBalance(address: string, assetId: number): Observable<AssetAmount>` | Subscribe token account balance. |
| `subscribeTokensBalance(address: string): Observable<AssetAmount[]>` | Subscribe tokens account balances. |
| `subscribeErc20Balance(address: string, includeOnly?: number[]):  Observable<AssetAmount[]>` | Subscribe erc20 assets balances |

➡️ For type definitions visit [types.ts](src/types.ts)<br />

#### Example

Subscribe hydration treasury account.

```typescript
import { api, client as c } from '@galacticcouncil/sdk-next';

const account = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"

const client = await api.getWs('wss://hydradx-rpc.dwellir.com');
const balanceClient = new c.BalanceClient(client);

const subscription = balanceClient
  .subscribeBalance(account)
  .subscribe((balances) => {
    console.log(balances);
  });

// Don't forget to cleanup the resources
subscription.unsubscribe();
client.destroy();
```

### AssetClient

Helper class to fetch registry metadata.

#### API Reference

| Method | Description |
| :----- | :----------- |
| `getOnChainAssets(includeInvalid?: boolean, external?: ExternalAsset[]): Promise<Asset[]>` | Returns assets with metadata from registry. |

➡️ For type definitions visit [types.ts](src/types.ts)<br />

#### Example

Get default on-chain data.

```typescript
import { api, client as c } from '@galacticcouncil/sdk-next';

const client = await api.getWs('wss://hydradx-rpc.dwellir.com');
const assetClient = new c.AssetClient(client);

const assets = await assetClient.getOnChainAssets();
console.log(assets);

// Don't forget to cleanup the resources
client.destroy();
```

## Examples

To demonstrate more full working examples on real chain see [script](test/script/examples) section.

### Execution

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.