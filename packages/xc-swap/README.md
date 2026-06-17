# @galacticcouncil/xc-swap

Cross-chain swap SDK for Hydration — **NEAR Intent Routing (NIR)**.

It lets a Hydration user buy a NEAR asset in a single transaction: sell asset
`A` on Hydration → WETH, bridge WETH via Wormhole/Moonbeam to Ethereum (where it
becomes native ETH at a [1Click](https://docs.near-intents.org/) deposit
address), and have 1Click swap ETH → the destination NEAR asset.

The SDK exposes the supported assets/chains/routes and provides
`estimateTrade(...)`, which returns a trade you can turn into the executable EVM
calls (`approve` + `IntentEmitter.swapAndBridge`) on Hydration's EVM layer.

**Phase 1 scope:** destination asset `nep141:wrap.near` (wrapped NEAR); origin =
any Hydration asset (the Omnipool always routes `A → WETH`/`A → GLMR`).

## Usage

```ts
import { sor, client, pool, api } from '@galacticcouncil/sdk-next';
import { createXcSwap } from '@galacticcouncil/xc-swap';

// Caller owns the connection: build a TradeRouter + fetch supported assets.
const router = new sor.TradeRouter(poolCtx);
const assets = await new client.AssetClient(papiClient).getSupported();

const xcSwap = createXcSwap({
  router,
  assets,
  emitter: '0x…', // IntentEmitter proxy on Hydration EVM
});

// Inspect what's supported.
xcSwap.getOriginAssets();      // every Hydration asset
xcSwap.getDestinationAssets(); // [ wrap.near ]
xcSwap.getChains();            // [ hydration, near ]
xcSwap.getRoutes();

// Estimate a trade.
const trade = await xcSwap.estimateTrade({
  assetIn: 5,                  // Hydration runtime asset id of A (e.g. DOT)
  amountIn: 10_000_000_000n,   // smallest unit
  recipient: 'alice.near',     // NEAR account
  refundTo: '0x…',             // Hydration EVM refund/sender address
});

console.log(trade.amountOut.toDecimal(), trade.amountOut.symbol);

// Build the executable calls: [approve, swapAndBridge].
const [approve, swapAndBridge] = trade.buildCalls();
```

## Notes

- Asset ids are **Hydration runtime asset ids** — the same id space used by
  `sdk-next`'s `TradeRouter` and by `IntentEmitter.swapAndBridge`. WETH is `20`,
  GLMR is `16` (mirrored from the WHM `HydrationConsts`).
- The relay-fee ceiling is read from a quoter
  (`GET /relay-fee?chain=ethereum&marginBps=…`); override via `quoterUrl`.
- See [`specs/phase-1-near-intent-routing.md`](./specs/phase-1-near-intent-routing.md)
  for the full design.
