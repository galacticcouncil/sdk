# Galactic SDK Next

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/sdk-next.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk-next)

Next gen hydration sdk build on top of [Polkadot API (Papi)](https://papi.how/).

⚠️ **Disclaimer:** Next is not prod ready yet. Official `1.x` release coming soon.

Missing functionality & progress tracked [here](https://github.com/galacticcouncil/sdk/issues/119)

Table of contents:

- [Installation](#installation)
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

`npm install @galacticcouncil/sdk-next`

## Usage

Use `createSdkContext` to quickly set up all components of the SDK — pool context, trading logic, client access, and transaction building — in a single call.

```ts
import { api, createSdkContext } from '@galacticcouncil/sdk-next';
import { createClient } from 'polkadot-api';

const provider = api.getWs('wss://hydradx-rpc.dwellir.com');
const client = createClient(provider);
const sdk = await createSdkContext(client);

// Don't forget to cleanup resources when DONE
sdk.destroy();
```

It handles all necessary setup under the hood. Just plug in your PolkadotClient, and you're ready to interact with registry, accounts, pools, router, and more.

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

- `pool: PoolContextProvider` — Internal stateful pool context. Initialized with support for:
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
| `getHealthFactorAfterWithdraw(user: string, reserve:number, withdrawAmount: string): number` | Calculate HF after withdraw. |
| `getHealthFactorAfterSupply(user: string, reserve:number, supplyAmount: string): number` | Calculate HF after supply. |
| `getMaxWithdraw(user: string, reserve:number): Amount` | Get max possible safe withdraw. |

➡️ For type definitions visit [types.ts](src/aave/types.ts)<br />

### TradeRouter

| Method | Description  |
| :----- | :----------- |
| `getPools(): PoolBase[]` | Returns the current list of available pools. |
| `getRoutes(assetIn: number, assetOut: number): Hop[][]` | Computes possible routes between two assets. |
| `getTradeableAssets(): number[]` | Lists all assets that are tradeable through the router. |
| `getBestSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string): Trade` | Find the best sell trade for given input amount. |
| `getBestBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string): Trade` | Find the best buy trade for given output amount. |
| `getBuy(tokenIn: number, tokenOut: number, amountOut: bigint \| string, route?: Hop[]): Trade` | Calculate a buy using a specific route (optional). |
| `getSell(tokenIn: number, tokenOut: number, amountIn: bigint \| string, route?: Hop[]): Trade` | Calculate a sell using a specific route (optional). |
| `getSpotPrice(tokenIn: number, tokenOut: number): Amount` | Get the current spot price between two tokens. |
| `getMostLiquidRoute(tokenIn: number, tokenOut: number): Hop[]` | Find the route with the highest liquidity between two tokens. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

### TradeScheduler

| Method | Description  |
| :----- | :----------- |
| `getDcaOrder(assetIn: number, assetOut: number, amountInTotal: string, duration: number): TradeDcaOrder` | Calculate DCA order. |
| `getTwapBuyOrder(assetIn: number, assetOut: number, amountInTotal: string): TradeOrder` | Calculate TWAP buy order. |
| `getTwapSellOrder(assetIn: number, assetOut: number, amountInTotal: string): TradeOrder` | Calculate TWAP buy order. |

➡️ For type definitions visit [types.ts](src/sor/types.ts)<br />

### BalanceClient

| Method | Description  |
| :----- | :----------- |
| `watchBalance(address: string): Observable<AssetAmount>` | Subscribe account balance. |
| `watchSystemBalance(address: string): Observable<AssetAmount>` | Subscribe native account balance. |
| `watchTokenBalance(address: string, assetId: number): Observable<AssetAmount>` | Subscribe token account balance. |
| `watchTokensBalance(address: string): Observable<AssetAmount[]>` | Subscribe tokens account balances. |
| `watchErc20Balance(address: string, includeOnly?: number[]):  Observable<AssetAmount[]>` | Subscribe erc20 assets balances |

➡️ For type definitions visit [types.ts](src/types.ts)<br />

### AssetClient

| Method | Description  |
| :----- | :----------- |
| `getSupported(includeInvalid?: boolean, external?: ExternalAsset[]): Promise<Asset[]>` | Returns assets with metadata from registry. |

➡️ For type definitions visit [types.ts](src/types.ts)<br />

## Examples

All examples assume sdk have been initialized [see](#usage)

### TradeRouter

Calculate sell of 1 DOT for HDX & build tx with 5% slippage (default to 1% if not specified)

```typescript
const { api, tx } = sdk;

const trade = await api.router.getBestSell(5, 10, 10_000_000_000n);
const tradeTx = await tx.trade(trade)
  .withBeneficiary(BENEFICIARY)
  .withSlippage(5)
  .build();
const tradeCall = await tradeTx.get().getEncodedData();
console.log(trade.toHuman());
console.log('Transaction hash:', tradeCall.asHex());
```

**Note:** For convenience, the router amount can be specified either as a native bigint or as a human-readable string.

For example, `"1"` DOT (string) is equivalent to `10_000_000_000n` (bigint), as DOT has 10 decimals.

### BalanceClient

Subscribe hydration treasury account.

```typescript
const { client } = sdk;

const account = "7L53bUTBbfuj14UpdCNPwmgzzHSsrsTWBHX5pys32mVWM3C1"
const subscription = client.balance
  .watch(account)
  .subscribe((balances) => {
    console.log(balances);
  });
```

### AssetClient

Get default on-chain data.

```typescript
const { client } = sdk;

const assets = await client.asset.getSupported();
console.log(assets);
```

To demonstrate more full working examples on real chain see [script](test/script/examples) section.

Run: `$ npx tsx ./test/script/examples/<examplePackage>/<exampleName>.ts` with valid example package & name.