# @galacticcouncil/xc-swap

Cross-chain swap SDK for Hydration — **NEAR Intent Routing (NIR)**.

It lets a Hydration user buy a NEAR asset in a single transaction: sell asset
`A` on Hydration → WETH, bridge WETH via Wormhole/Moonbeam to Ethereum (where it
becomes native ETH at a [1Click](https://docs.near-intents.org/) deposit
address), and have 1Click swap ETH → the destination NEAR asset.

The SDK exposes the supported assets/chains/routes and provides `swap(...)` (a
`dry` quote — amounts only), whose result can `buildCall()` the executable EVM
calls (`approve` + `IntentEmitter.swapAndBridge`) on Hydration's EVM layer from a
firm quote. `approve` is omitted when the emitter already has sufficient
allowance.

**Phase 1 scope:** destination assets `nep141:wrap.near` (wrapped NEAR) and
`nep141:zec.omft.near` (ZEC) — sourced from the 1Click token registry; origin =
any Hydration asset (the Omnipool always routes `A → WETH`/`A → GLMR`).

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

// Build the executable request from a firm quote (yields the deposit address).
// `calls` is [approve, swapAndBridge] — or just [swapAndBridge] when already approved.
const { calls, depositAddress, intentId } = await trade.buildCall();
```

## Notes

- Asset ids are **Hydration runtime asset ids** — the same id space used by
  `sdk-next`'s `TradeRouter` and by `IntentEmitter.swapAndBridge`. WETH is `20`,
  GLMR is `16` (mirrored from the WHM `HydrationConsts`).
- `slippage` and `relayMargin` are expressed in **percent** (1 = 1%), matching
  `sdk-next`'s `TradeTxBuilder.withSlippage`. The relay-fee ceiling is read from a
  quoter (`GET /relay-fee?chain=ethereum&marginBps=…`); override via `quoterUrl`.
- See [`docs/spec.md`](./docs/spec.md) for the full design.
