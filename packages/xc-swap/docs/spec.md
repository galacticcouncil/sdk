# SPEC — `xc-swap`: Hydration → NEAR Intents

Lets a Hydration user buy any NEAR-Intents-supported asset (NEAR, ZEC, …) in one transaction.
Asset `A` is sold for WETH on Hydration, settled to Ethereum over NTT, and forwarded into a 1Click
deposit address that NEAR Intents credits.

The on-chain entry point is `IntentEmitter.placeOrder(...)` on Hydration's EVM layer
(`galacticcouncil/whm`, `contracts/src/intents/IntentEmitter.sol`). This package is the off-chain
half: it quotes the swap, prices both fees, and returns ready-to-sign EVM calls.

## Flow

```
HYDRATION   placeOrder(assetIn, amountIn, minEthOut, depositAddress, maxRelayFee)
              1. sell assetIn → WETH via the router   (no-op when assetIn is WETH)
              2. deduct cost = NTT deliveryPrice + wormhole messageFee
              3. quantize to TRIM_UNIT (1e10) — NTT trims to 8dp, WETH is 18dp
              4. nttManager.transfer(amount, 2, IntentReceiver)   → transferSequence
              5. publishMessage(abi.encode(
                     transferSequence, depositAddress, amount, maxRelayFee))
              → emits OrderPlaced

ETHEREUM    IntentReceiver.processOrder(nttVaa, instructionVaa, feeRequested)
              pairs the two messages on the NTT manager sequence, delivers the
              settlement, forwards (amount − feeRequested) to depositAddress
              → emits OrderProcessed, RelayFeePaid

NEAR        POA credits the deposit address; 1Click's solver network settles
            ETH → destination asset and delivers to the recipient
```

Two Wormhole messages leave the same Hydration transaction, because NTT carries no payload of its
own — the destination has to travel separately. They are joined by the **NTT manager's sequence**,
which is neither a Wormhole sequence nor chain-global.

Relaying and the 1Click deposit notification are handled out-of-band by WHM's `relayer` and
`nintent` agents. This SDK's responsibility ends at the signed Hydration transaction.

## Entry point

```solidity
function placeOrder(
    uint32  assetIn,        // Hydration runtime asset id sold
    uint256 amountIn,       // pulled from the caller
    uint256 minEthOut,      // floor on the settled amount, post-cost and post-trim
    address depositAddress, // Ethereum recipient (1Click quote address)
    uint256 maxRelayFee     // ceiling a redeemer may claim on Ethereum
) external returns (uint64 transferSequence);
```

Selector `0xb3218305`. Not payable: both fees come out of the swap output, which works because
Hydration's native currency *is* WETH — one balance behind two interfaces.

`maxRelayFee` is committed by the caller rather than operator-set. Paired with a colluding relayer a
ceiling is a claim on the order's value, so it belongs to whoever's funds are at risk.

## Fee model

The rail's cost is charged against the swap **output**, not bought from the input:

```
wethOut    = router.getBestSell(assetIn, WETH_ID, amountIn)
cost       = nttManager.quoteDeliveryPrice(2, 0x00).total + wormhole.messageFee()
bridged    = trim(wethOut − cost)                    // trim(x) = x − x % TRIM_UNIT
minEthOut  = trim(padDown(bridged, slippageBps))
swapAmount = bridged − maxRelayFee                   // what lands at depositAddress
```

`fee` on the returned trade is `wethOut − swapAmount` — the delivery price, the quantization dust,
and the relay fee ceiling, all valued in WETH.

`minEthOut` is expressed against what actually bridges. The emitter trims it and raises the router's
own floor by `cost`, so a floor computed against the raw swap output would be too high by `cost`.

**`cost` is currently zero on the prod rail** — the WHM relayer takes its compensation on the
Ethereum side via `maxRelayFee`, so the Wormhole rail itself charges nothing. It is read at runtime
rather than assumed, so a re-priced rail does not silently overstate the output or produce a floor
that reverts.

### Quantization dust

NTT trims to 8 decimals and WETH carries 18, so the remainder is left in the emitter as sweepable
dust rather than refunded — refunding would cost more than the dust is worth. At most `1e10` wei
(0.00000001 WETH) per order.

## Estimate orchestration (`trade/swap.ts`)

1. **Sell leg** — `getBestSell(assetIn, WETH_ID, amountIn)` for the whole input. Skipped when
   `assetIn` is WETH, in which case the emitter settles it as-is.
2. **In parallel** — relay-fee quote, rail state, asset descriptors, and a dry 1Click quote priced
   at the full `wethOut`. The dry quote's API errors are mapped to `XcSwapError`, not thrown.
3. **Derive** `bridged`, `minEthOut`, `swapAmount`; scale the quote's outputs to the net that
   actually lands. The quoted rate is linear in the input, so scaling is exact.
4. **Collect viability errors** — reported on the trade rather than thrown.
5. `buildCall()` — requests a firm quote sized to `swapAmount` (yields the deposit address), reads
   the emitter's allowance over `A`, and returns `[approve, placeOrder]` (or just `[placeOrder]`
   when already approved).

The two-quote split exists so estimation runs concurrently with the relay-fee fetch and mints no
deposit address; only `buildCall()` commits to one.

## Rail reads

Settlement contracts are read from the emitter's own getters rather than hardcoded, so they survive
a re-point via `setNttManager` / `setIntentReceiver`.

| Read | Source | Cached |
| ---- | ------ | ------ |
| `nttManager`, `wormhole` | `IntentEmitter` | client lifetime |
| `quoteDeliveryPrice`, `messageFee` | manager, core bridge | `railTtl` (default 30s) |
| `isPaused`, `getCurrentOutboundCapacity` | manager | `railTtl` |

A failed read is not cached, so the next estimate retries. Governance parameters and rail activity
move on very different timescales, hence the split.

## Viability errors

Reported on the trade rather than thrown, so a UI can render a non-viable quote. Most pre-empt a
specific on-chain revert:

| `XcSwapError` | Guard | Pre-empts |
| ------------- | ----- | --------- |
| `BelowDeliveryPrice` | `wethOut <= cost` | `AmountBelowDeliveryPrice` |
| `BelowTrimUnit` | `trim(wethOut − cost) == 0` | `AmountBelowTrimUnit` |
| `RelayFeeExceedsAmount` | `maxRelayFee >= bridged` | `RelayFeeExceedsAmount` |
| `RailPaused` | `nttManager.isPaused()` | NTT transfer revert |
| `RailRateLimited` | `bridged > outbound capacity` | NTT rate-limit revert |
| `MinWethNotMet` | `minEthOut < MIN_WETH` | — |
| `RelayFeeTooHigh` | `bridged < 2 × maxRelayFee` | — |
| `AmountTooLow`, `RecipientInvalid`, `QuoteFailed` | 1Click quote | — |

`RailRateLimited` matters because the emitter's `transfer` overload pins `shouldQueue = false`: an
oversized settlement **reverts** rather than queueing. The limit is currently set to the u64-max
sentinel (uncapped) over a 24h window.

`InsufficientOutput` (`bridged < minEthOut`) is not pre-checkable — it depends on the sell's actual
execution, which is the point of the floor.

## Tracking an order

`transferSequence` is the join key on-chain, but it only exists once the transaction lands. Before
submission the correlation key is **`depositAddress`**: unique per 1Click quote and indexed on both
`OrderPlaced` (Hydration) and `OrderProcessed` (Ethereum).

`ORDER_PLACED_ABI` is exported so a consumer can decode `transferSequence` from the receipt.

## Constants

```
Hydration EVM chain id       222222
Hydration Wormhole chain id  73
Ethereum Wormhole chain id   2

IntentEmitter   (Hydration)  0x98f1ebc9dcc8ab7ba54d83c98500e9e313f793f2
IntentReceiver  (Ethereum)   0x2173F6ecE25768e7EFc5199f70f8783d88Ba63c8
WETH NttManager (Hydration)  0xB5cEf790D52A57fa619eD96eDd64c5328F3DCFb7
Wormhole core   (Hydration)  0x3792a6d63c31941B2805181771795D9176fA82A1

WETH_ID     20            confirmed against nttManager.token()
TRIM_UNIT   1e10          NTT 8dp vs WETH 18dp
MIN_WETH    4e14          0.0004 WETH
ORIGIN      nep141:eth.omft.near     native ETH on Ethereum, credited by POA
```

Asset ids are Hydration **runtime** ids, shared by `sdk-next`'s `TradeRouter` and the emitter.
`xc-cfg`'s display ids (`eth=34`, `weth=1000189`) are a different namespace — do not mix them.

The ERC-20 precompile address of a runtime asset is `0x0100000000 | assetId`.

## Layout

```
src/
  factory.ts            createXcSwap(opts) -> XcSwapClient
  client.ts             listing APIs, swap(), rail caching
  types.ts              public types and XcSwapError
  registry/
    consts.ts           ids, rail precision, defaults
    chains.ts           origin/destination chain metadata
    assets.ts           1Click token ↔ asset descriptor mapping
    routes.ts           route metadata
  quote/
    relayFee.ts         GET {quoter}/relay-fee -> maxRelayFee
    oneClick.ts         1Click client config, tokens, getQuote
  trade/
    swap.ts             estimate orchestration
    rail.ts             emitter config + live NTT rail state
    builder.ts          [approve, placeOrder] EvmCall[]
    abi.ts              placeOrder, OrderPlaced, NTT + Wormhole reads
    types.ts            SwapContext, BuildCallsParams
    utils.ts            AssetAmount helper, padDown, trim
```

## Verification

- `npm run build` (dual ESM/CJS + declarations) and `npm test` in the package.
- Unit tests mock the `TradeRouter`, the relay-fee `fetch`, `OneClickService.getQuote`, and the EVM
  provider's `readContract` (which dispatches on `functionName` to serve both rail reads and the
  ERC-20 allowance).
- The `placeOrder` encoding is checked against the deployed proxy rather than only against itself: a
  staticcall with `amountIn = 0` reverts `ZeroAmount()` (`0x1f2a2005`), the first guard inside the
  function, which proves the signature resolves on-chain.

## Known gap

The **Ethereum-side inbound** rate limit is not checked. NTT *queues* rather than reverts on the
receiving end, so a settlement above that limit lands in `IntentReceiver` uncredited and
`processOrder` reverts `SettlementNotReleased` until the queued transfer is completed. That is a
worse failure than a clean revert, but it needs an Ethereum connection the SDK does not hold.
