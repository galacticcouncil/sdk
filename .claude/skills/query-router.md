# Query Router

Run SDK router queries (spot price, most liquid route, best sell/buy, routes) against a live Hydration RPC. No files written — runs inline via `npx tsx -e`.

## When to Use

When you need to query on-chain trading data: spot prices between assets, find routes, get the most liquid route, or simulate a trade.

## Parameters

- **query**: One of `getSpotPrice`, `getMostLiquidRoute`, `getBestSell`, `getBestBuy`, `getRoutes`
- **assetIn**: Hydration asset ID (number, e.g. `0` = HDX, `5` = DOT, `10` = USDT)
- **assetOut**: Hydration asset ID
- **amount** (for sell/buy only): Trade amount as string or bigint literal
- **rpcUrl** (optional): Defaults to `wss://hydration-rpc.n.dwellir.com`. Valid endpoints from `packages/sdk-next/test/script/types.ts`:
  - `wss://hydration-rpc.n.dwellir.com` (Hydration)
  - `wss://chopsticks.rpc.hydration.cloud` (Chopsticks)
  - `ws://localhost:8000` (Local)
  - `wss://node.lark.hydration.cloud` (Lark1)
  - `wss://node2.lark.hydration.cloud` (Lark2)
  - `wss://node3.lark.hydration.cloud` (Lark3)
  - `wss://node4.lark.hydration.cloud` (Lark4)

## Workflow

Read the example scripts in `packages/sdk-next/test/script/examples/router/` and adapt the pattern for the user's query. All examples extend `PapiExecutor` which handles connection, logging, and cleanup. Run from `packages/sdk-next/` — no build step needed.

```sh
cd packages/sdk-next && npx tsx test/script/examples/router/<script>.ts
```

To run a custom query, write an inline script adapting the example pattern:

```sh
cd packages/sdk-next && npx tsx -e "<inline script>"
```

## Available Router API Methods

From `sdk.api.router` (TradeRouter):

| Method | Signature | Returns |
|--------|-----------|---------|
| `getSpotPrice` | `(assetIn: number, assetOut: number)` | `{ amount: bigint, decimals: number }` |
| `getMostLiquidRoute` | `(assetIn: number, assetOut: number)` | Best route by liquidity |
| `getRoutes` | `(assetIn: number, assetOut: number)` | All possible routes |
| `getBestSell` | `(assetIn: number, assetOut: number, amount: string \| bigint)` | Best sell trade |
| `getBestBuy` | `(assetIn: number, assetOut: number, amount: string \| bigint)` | Best buy trade |

For sell/buy trades that return a trade object, use `.toHuman()` for readable output.

## Cautions

- Connects to **live RPCs** — read-only queries but opens WebSocket connections.
- Asset IDs are Hydration-specific integers. Common: `0` (HDX), `5` (DOT), `10` (USDT), `20` (WETH).
- Always call `sdk.destroy()` then `client.destroy()` — otherwise the process hangs.
- Must run from `packages/sdk-next/` — the `./src/index.ts` import is relative.
- Use timeout of 60s on the Bash call — RPC connection + pool context init takes time.
