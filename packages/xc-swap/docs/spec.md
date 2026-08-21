# Plan: `xc-swap` — cross-chain swap SDK (NEAR Intent Routing, phase 1)

## Context

WHM (`galacticcouncil/whm`) ships a "NEAR Intent Routing" (NIR) flow that lets a Hydration
user buy a NEAR asset in **one transaction**: sell asset A on Hydration → WETH, bridge WETH
via Wormhole/Moonbeam to Ethereum where it becomes native ETH at a 1Click deposit address,
and 1Click swaps ETH → the destination NEAR asset. The on-chain entry point is
`IntentEmitter.swapAndBridge(...)` on Hydration's EVM layer (see
`/Users/PaloTropiHlouposti/Workspace/evm/whm/contracts/src/intents/IntentEmitter.sol`,
`IntentEmitterWtt.sol`, and the driver `contracts/scripts/nirViaWtt.ts`).

Today this flow only exists as Solidity + ad-hoc scripts and a POC example
(`examples/xc-transfer/src/intent.ts`). There is no reusable SDK: a frontend wanting to
quote and execute the swap has to hand-roll the 1Click quote, the relay-fee lookup, the
intentId/payload encoding, the Hydration sell/fee quoting, and the EVM calls.

**Goal:** a new `@galacticcouncil/xc-swap` package that (1) exposes the supported
assets/routes/chains and (2) provides `estimateTrade(params): Promise<XcSwapTrade>` plus a
builder that returns the ready-to-sign EVM calls (`approve` + `swapAndBridge`).

**Phase-1 scope (per user):**
- Destination asset: **only** `nep141:wrap.near` (wrapped NEAR), recipient = a NEAR account.
- Origin asset A: **any Hydration asset** (Omnipool always routes A → WETH / A → GLMR).
- Executable tx: the Hydration `IntentEmitter.swapAndBridge(...)` EVM call (chain 222222),
  preceded by the ERC-20 `approve` of A to the emitter. WTT variant semantics (uses
  `maxRelayFee`).
- Lives in the **SDK monorepo** as a sibling of `xc`, published `@galacticcouncil/xc-swap`.

## Reference flow (verified)

`swapAndBridge(assetIn, amountIn, minEthOut, maxFeeIn, intentId, intentDepositAddress, maxRelayFee)`
(`IIntentEmitter.sol`). Internally: buy `xcmFee` GLMR with ≤`maxFeeIn` of A (withheld if
A==GLMR), sell remaining A → WETH (skipped if A==WETH), enforce `wethOut >= minEthOut`,
reserve-transfer [GLMR, WETH] to the MDA on Moonbeam and bridge WETH→ETH to the 1Click
`intentDepositAddress` on Ethereum.

`nirViaWtt.ts` shows the off-chain pieces the SDK must reproduce:
1. `maxRelayFee` = `GET {quoter}/relay-fee?chain=ethereum&marginBps=<n>` → `{ feeRequested }`,
   default quoter `https://quoter-api.play.hydration.cloud`.
2. 1Click `getQuote` with `swapType=FLEX_INPUT`, `originAsset='nep141:eth.omft.near'`,
   `destinationAsset='nep141:wrap.near'`, `amount = bridgedWeth − maxRelayFee` (the fee is
   skimmed on Ethereum), `recipientType=DESTINATION_CHAIN`, `refundType=ORIGIN_CHAIN`.
3. `intentId = keccak256(abi.encode(correlationId:string, depositAddress:address,
   amountIn:uint256, deadline:string))` (matches `nirViaWtt.ts:119-124`).

**Asset-id reconciliation (build-time verify):** `swapAndBridge` and `sdk-next`'s
`TradeRouter` both key on **Hydration runtime asset ids**. `HydrationConsts.sol` uses
`WETH_ID=20`, `GLMR_ID=16`. `xc-cfg`'s display ids (`eth=34`, `weth=1000189`) are NOT these —
phase 1 must use the runtime ids from `sdk-next`'s asset registry / `HydrationConsts`, and
confirm `20`/`16` against the live runtime before wiring.

## Package layout (mirrors `packages/xc`)

```
packages/xc-swap/
  package.json          # @galacticcouncil/xc-swap, main/module/types, dual build, files:[build]
  tsconfig.json         # extends ../../tsconfig.json, baseUrl src
  turbo.json            # build dependsOn xc-core#postbuild, sdk-next#postbuild, ^build/^postbuild
  esbuild.dist.mjs / esbuild.dev.mjs   # copy from packages/xc
  jest.config.mjs
  README.md
  src/
    index.ts            # barrel: factory, types, registry
    types.ts            # XcSwapParams, XcSwapTrade, XcSwapAsset, XcSwapRoute, XcSwapCall
    factory.ts          # createXcSwap(opts) -> XcSwapClient
    client.ts           # XcSwapClient: listing APIs + estimateTrade
    registry/
      consts.ts         # HydrationConsts mirror (WETH_ID, GLMR_ID, toErc20, ETHEREUM_WORMHOLE_ID,
                         #   emitter addr, default quoter URL, ORIGIN_ASSET='nep141:eth.omft.near')
      assets.ts         # origin assets (Hydration runtime ids/decimals/erc20) + dest NEAR asset(s)
      chains.ts         # supported chains meta (hydration origin, near destination)
      routes.ts         # route metadata (hydration -> near via WTT)
    quote/
      relayFee.ts       # fetchMaxRelayFee(quoterUrl, chain, marginBps)
      oneClick.ts       # getOneClickQuote(...) wrapper over OneClickService.getQuote
    trade/
      estimate.ts       # estimateTrade orchestration (Hydration legs + 1Click + intentId)
      build.ts          # buildCalls(trade) -> [approve, swapAndBridge] EvmCall[]
      abi.ts            # swapAndBridge ABI fragment + erc20 approve ABI
    *.spec.ts           # co-located unit tests
```

Add the package to root build/test (it's picked up by npm workspaces + turbo automatically).
Update `jest.resolver.cjs` only if cross-package source tests are needed (likely not for unit tests).

## Public API

```ts
// factory.ts
export function createXcSwap(opts: XcSwapOpts): XcSwapClient;

interface XcSwapOpts {
  router: sor.TradeRouter;        // injected sdk-next router (caller owns papi connection)
  evmChainId?: number;            // default 222222 (Hydration EVM)
  emitter: string;               // IntentEmitter proxy address on Hydration EVM
  quoterUrl?: string;            // default https://quoter-api.play.hydration.cloud
  relayMarginBps?: number;       // default 2000 (matches nirViaWtt MAX_FEE_MARGIN_BPS)
  oneClick?: { baseUrl?: string; jwt?: string };
}

// client.ts
class XcSwapClient {
  getOriginAssets(): XcSwapAsset[];          // all Hydration assets
  getDestinationAssets(): XcSwapAsset[];     // phase 1: [wrap.near]
  getChains(): XcSwapChain[];                // hydration, near
  getRoutes(): XcSwapRoute[];                // metadata: origin/dest assets+chains, oneClick ids, decimals
  estimateTrade(params: XcSwapParams): Promise<XcSwapTrade>;
}

interface XcSwapParams {
  assetIn: number | XcSwapAsset;   // Hydration runtime asset id of A
  amountIn: bigint | string;       // smallest unit of A
  destinationAsset?: string;       // default 'nep141:wrap.near'
  recipient: string;               // NEAR account id (dest chain)
  refundTo: string;                // Hydration EVM (origin) refund address; also tx `from`
  slippageBps?: number;            // default 100
  deadline?: Date;                 // default now + 30m
}

interface XcSwapTrade {
  // origin (Hydration) legs
  amountIn: AssetAmount;           // A pulled from caller
  maxFeeIn: AssetAmount;           // ≤ A spent buying the GLMR xcmFee (slippage-bounded)
  wethOut: AssetAmount;            // expected WETH bridged
  minEthOut: AssetAmount;          // slippage floor passed to swapAndBridge
  maxRelayFee: bigint;             // from quoter
  // 1Click leg
  depositAddress: string;          // intentDepositAddress on Ethereum
  amountOut: AssetAmount;          // expected wrap.near out
  minAmountOut: AssetAmount;
  intentId: `0x${string}`;
  correlationId: string;
  deadline: string;
  timeEstimate: number;
  priceImpactPct: number;
  // executable
  buildCalls(): XcSwapCall[];      // [approve, swapAndBridge] as EvmCall on Hydration EVM
}
```

`XcSwapCall` reuses `EvmCall`/`CallType` from `xc-sdk`/`xc-core` (as in `intent.ts`) so output
plugs into the existing signer path; `buildCalls` builds data via viem `encodeFunctionData`.

## estimateTrade orchestration (`trade/estimate.ts`)

1. Resolve A (runtime id, decimals, erc20 addr via `toErc20`) and destination (wrap.near,
   24 dp, NEAR account recipient).
2. `maxRelayFee = fetchMaxRelayFee(quoterUrl, 'ethereum', relayMarginBps)`.
3. Hydration quote legs via injected `router` (`sor.TradeRouter`):
   - **fee buy:** `getBestBuy(A, GLMR_ID, xcmFee)` → `maxFeeIn` (+slippage). If A==GLMR, skip;
     fee is withheld (`maxFeeIn=0`, effective amount = amountIn − xcmFee).
   - **sell:** `getBestSell(A, WETH_ID, amountIn − feeSpent)` → `wethOut`. If A==WETH, skip
     sell; `wethOut = amountIn − feeSpent`.
   - `minEthOut = wethOut · (1 − slippageBps/1e4)`; carry `priceImpactPct` from the sell trade.
   - `xcmFee` default mirrors the contract (`1e18` GLMR); expose as a const, refine in build.
4. `swapAmount = wethOut − maxRelayFee` (guard `> 0`).
5. 1Click `getQuote` (FLEX_INPUT, originAsset `nep141:eth.omft.near`, destinationAsset
   param, `amount=swapAmount`, recipient, refundTo, deadline) → `depositAddress`,
   `amountOut`, `minAmountOut`, `correlationId`.
6. `intentId` = keccak256 over `(correlationId, depositAddress, BigInt(quote.amountIn),
   deadline)` per `nirViaWtt.ts`.
7. Assemble `XcSwapTrade`; `buildCalls()` closes over the resolved values.

`buildCalls()` (`trade/build.ts`): `approve(emitter, amountIn)` on A's erc20, then
`swapAndBridge(A, amountIn, minEthOut, maxFeeIn, intentId, depositAddress, maxRelayFee)` on the
emitter — both `EvmCall { from: refundTo, to, data, type: CallType.Evm, dryRun }`.

## Dependencies (peers, matching repo convention)

- peer: `@galacticcouncil/sdk-next` (TradeRouter), `@galacticcouncil/xc-core` (Asset/AssetAmount/CallType),
  `@galacticcouncil/xc-sdk` (EvmCall type), `viem`, `polkadot-api`.
- dep: `@defuse-protocol/one-click-sdk-typescript` (already in the repo lockfile via the example).
- Reuse `AssetAmount` from `xc-core` for human-readable amounts; reuse `keccak256`,
  `encodeAbiParameters`, `encodeFunctionData`, `erc20Abi` from `viem`.

## Verification

1. `cd packages/xc-swap && npm run build` (dual ESM/CJS) and `npm run build` at root (turbo
   rebuilds dependents) — clean build confirms types.
2. Unit tests (`*.spec.ts`, Jest): registry listings non-empty and well-formed; `estimateTrade`
   with mocked `TradeRouter` + mocked `fetch` (relay-fee) + mocked `OneClickService.getQuote`
   produces a consistent `XcSwapTrade` (swapAmount = wethOut − maxRelayFee; minEthOut applies
   slippage; intentId matches the keccak256 of known inputs vs a `nirViaWtt.ts` fixture).
   `buildCalls()` returns `[approve, swapAndBridge]` with `data` decodable back to expected args.
3. Add an `examples/xc-transfer/src/intent_swap.ts` (or extend `intent.ts`) that wires a real
   `sor.TradeRouter` + emitter address and logs an estimate end-to-end (dry, no signing) — the
   manual smoke test that mirrors `nirViaWtt.ts`.
4. Add a changeset (`npm run changeset`) — new package, minor.

## Open items to confirm during build (not blocking the plan)

- Live Hydration runtime ids for WETH/GLMR (expect 20/16 per `HydrationConsts`); confirm the
  deployed Hydration-side `IntentEmitter` proxy address (prod alpha deployed the **Bjp**
  variant on Ethereum; the Hydration emitter address is supplied via `XcSwapOpts.emitter`).
- Exact `xcmFee`/`maxFeeIn` sizing (contract default 1 GLMR) and whether to read it from the
  deployed emitter (`xcmFee()` view) rather than hard-coding.
