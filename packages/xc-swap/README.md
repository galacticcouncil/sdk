# @galacticcouncil/xc-swap

Cross-chain swap SDK for Hydration — **NEAR Intent Routing (NIR)**.

It lets a Hydration user buy a NEAR asset in a single transaction: sell asset
`A` on Hydration → WETH, settle the WETH to Ethereum over NTT (where it becomes
native ETH at a [1Click](https://docs.near-intents.org/) deposit address), and
have 1Click swap ETH → the destination NEAR asset.

The SDK exposes the supported assets/chains/routes and provides `swap(...)` (a
`dry` quote — amounts only), whose result can `buildCall()` the executable EVM
calls (`approve` + `IntentEmitter.placeOrder`) on Hydration's EVM layer from a
firm quote. `approve` is omitted when the emitter already has sufficient
allowance.

**Phase 1 scope:** destination assets `nep141:wrap.near` (wrapped NEAR) and
`nep141:zec.omft.near` (ZEC) — sourced from the 1Click token registry; origin =
any Hydration asset (the Omnipool always routes `A → WETH`).

## Usage

```ts
import { createSdkContext } from '@galacticcouncil/sdk-next';
import { createXcSwap } from '@galacticcouncil/xc-swap';

// Caller owns the connection: build the sdk-next context (router + asset & EVM
// clients). xc-swap reads everything it needs from it.
const sdk = await createSdkContext(papiClient);

const xcSwap = createXcSwap({
  sdk,
  emitter: '0x…', // IntentEmitter proxy on Hydration EVM
});

// Inspect what's supported.
await xcSwap.getOriginAssets();      // every Hydration asset
await xcSwap.getDestinationAssets(); // [ wrap.near, ZEC ] (from 1Click /v0/tokens)
xcSwap.getChains();                  // [ hydration, near, zec ]
await xcSwap.getRoutes();

// Estimate a swap (dry quote — amounts only, no deposit address).
const trade = await xcSwap.swap({
  assetIn: 5,                          // Hydration runtime asset id of A (e.g. DOT)
  amountIn: 10_000_000_000n,           // smallest unit
  destinationAsset: 'nep141:wrap.near',// required
  recipient: 'alice.near',             // NEAR account
  refundTo: '0x…',                     // Hydration EVM refund/sender address
  slippage: 1,                         // percent (1 = 1%); optional, default 1
});

console.log(trade.amountOut.toDecimal(), trade.amountOut.symbol);

// Viability is reported, not thrown — check before building.
if (trade.errors.length) return;

// Build the executable request from a firm quote (yields the deposit address).
// `calls` is [approve, placeOrder] — or just [placeOrder] when already approved.
const { calls, depositAddress, correlationId } = await trade.buildCall();
```

## Notes

- Asset ids are **Hydration runtime asset ids** — the same id space used by
  `sdk-next`'s `TradeRouter` and by `IntentEmitter.placeOrder`. WETH is `20`
  (mirrored from the WHM `HydrationConsts`).
- `slippage` and `relayMargin` are expressed in **percent** (1 = 1%), matching
  `sdk-next`'s `TradeTxBuilder.withSlippage`. The relay-fee ceiling is read from a
  quoter (`GET /relay-fee?chain=ethereum&marginBps=…`); override via `quoterUrl`.
- Both fees come out of the swap **output**, not the input: the emitter deducts
  the rail's delivery price from the bridged WETH, and the relay fee is skimmed
  on Ethereum. `trade.fee` carries the total, valued in WETH.
- `trade.errors` reports viability (`XcSwapError`) instead of throwing, so a
  non-viable quote still renders. Most entries pre-empt an on-chain revert —
  including a paused or rate-limited NTT rail, which reverts rather than queues.
- Track an order by `depositAddress` (unique per quote, indexed on both
  `OrderPlaced` and `OrderProcessed`). Once the transaction lands, decode
  `transferSequence` from the receipt with the exported `ORDER_PLACED_ABI`.
- See [`docs/spec.md`](./docs/spec.md) for the full design.
