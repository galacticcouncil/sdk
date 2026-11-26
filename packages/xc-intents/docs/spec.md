# SPEC — `xc-intents`: Hydration → ZEC, BTC, NEAR

Lets a Hydration user swap or TWAP any Hydration asset into ZEC, BTC or NEAR on its own chain, in
one Hydration signature.

The on-chain half lives in `galacticcouncil/whm` (`contracts/src/intents-v2/`,
`crates/near/contracts/intent-router/`). This package is the off-chain half: it builds and checks the
terms, derives the deposit account, sizes the order and returns what the owner signs.

## Flow

```
HYDRATION   ICE intent: sell assetIn → WETH (Swap or Dca)
              on_resolved = Forward { dispatcher, abi.encode(0xN, C, terms) }
            dispatcher, called as the owner:
              checks the terms, deducts cost, bridges the WETH over NTT
              → order published to Ethereum

ETHEREUM    relayer delivers the ETH (less at most C) to 0xN
              0xN = 1Click deposit address → credits A on NEAR Intents

NEAR        router signs, for A:
              swap   ETH → destination via 1Click, at or above the terms' floors
              deliver A's destination balance to the recipient (UTXO withdraw or NEAR)
              refund  A's ETH to refundTo, after the deadline or a close
```

Every order of one action credits the same `A`. A TWAP is one set of terms and many orders.

## Terms

One set of terms per action: one swap, or one whole TWAP. Every field is hashed into `A`, so
changing any field makes a new action.

| Field               | Set to                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| `owner`             | `H160.fromAny(account)`: the EVM address ICE calls the dispatcher as      |
| `quoteId`           | random 32 bytes                                                          |
| `maxSlippageBps`    | 300                                                                      |
| `maxFillMultiplier` | swap 2; TWAP the tranche count, clamped to 2..100                        |
| `minOutPerIn`       | live `outPerIn` less `floorBps` (default 2000)                           |
| `minDelivery`       | swap: route minimum (1 without one); TWAP: user's, at least the minimum  |
| `deadline`          | swap: ICE deadline + 1 h; TWAP: start + tranches × period × 2.2 s + 2 h   |
| `recipientKind`     | 0 withdraw to the asset's chain, 1 NEAR intents account                  |
| `refundTo`          | checksummed Ethereum address                                             |
| `destinationAsset`  | intents ledger id                                                        |
| `recipient`         | address or NEAR account                                                  |

Encoded packed, version 1 (`terms/codec.ts`); strings are printable ASCII, 1..255 bytes.
`authPath = keccak256(encoded)`. `buildCall()` also has the dispatcher encode the terms
(`computeTerms`, `computeAuthPath`) and refuses on any mismatch.

## Deposit account and 1Click deposit

```
A   = v1.signer.derived_public_key({ path: authPath, predecessor: router, domain_id: 1 })
      → implicit NEAR account (hex of the ed25519 key)
0xN = 1Click deposit to A: an Ethereum deposit address crediting A
```

`0xN` comes from a 1Click quote with any input and no swap (`1cs_v1:any` → `1cs_v1:original`),
recipient and refund `A`, valid until 2038. It uses xc-swap's distribution-channel token unless
`oneClick.jwt` is set. Nothing on-chain binds `0xN` to the terms: `buildCall()` uses it only when the
returned quote names `A` as both recipient and refund.

The 1Click client is configured globally (`OpenAPI.BASE` / `TOKEN`), shared with xc-swap: the
client created last sets it.

## Sizing

```
cost       = nttManager.quoteDeliveryPrice(2, 0x00).total + wormhole.messageFee()
C          = quoter relay-fee ceiling (+20%)
need       = max( minOrderAmount + C,
                  2·C,
                  C + ⌈ routeMin · 1e18 · 10000 / (minOutPerIn · 9900) ⌉ )   // if routeMin > 0
least      = cost + ⌈ need / 1e10 ⌉ · 1e10
```

Every order must sell at least `least` WETH after slippage: one swap, and each TWAP tranche alike.
The route minimum term makes the worst accepted fill, `(bridged − C) × 0.99` at the hard floor,
reach the payout route's minimum (ZEC 100,000 zat, BTC 6,400 sat), so every order pays out on its
own. A balance under the route minimum cannot be withdrawn, and a refund moves ETH only: sized this
way, nothing strands in `A`. A `minDelivery` above the minimum still batches payouts, as whatever is
left is at least one order.

`C` moves with Ethereum gas several times a day. It is read at estimate and again in `buildCall()`,
never cached.

## ICE intents

Submitted on `api` through `sdk-next`'s intent builders, with `withForward` setting `on_resolved`.

| Kind | Intent                                                                         | Deadline       |
| ---- | ------------------------------------------------------------------------------ | -------------- |
| swap | `Swap { assetIn → WETH, amount_out: minWethOut, partial: false }`              | 60 min default |
| TWAP | `Dca { amount_in: perTrade, amount_out: minWethOut, budget: perTrade × tranches, period }` | none |

The forward data is `abi.encode(0xN, C, terms)`, at most 512 bytes. Selling WETH itself skips ICE,
which refuses WETH → WETH: the owner approves the dispatcher on the WETH precompile and calls
`dispatch(amount, 0xN, C, terms)` directly.

## Estimate and build (`trade/`)

1. `swap(params)` / `twap(params)` read in parallel: UTXO routes, `outPerIn`, relay ceiling, order
   base, recipient check. Then the Hydration sell of one trade into WETH.
2. Derive `least`, `minWethOut`, expected and worst-case output; collect viability errors.
3. `buildCall()`: fix the terms with a fresh quote id and deadlines from now, encode and cross-check
   them, derive `A`, then in parallel make the 1Click deposit `0xN`, re-read `C` and the order base. Refuse when the
   estimate has errors or the order no longer clears `least`. Return the ICE `Tx` (`kind: 'intent'`)
   or the WETH `dispatch` calls (`kind: 'dispatch'`).

No 1Click deposit is made during estimates: only `buildCall()` commits to terms.

## Viability errors

Reported on the trade, not thrown. Unsupported assets, network failures and failed checks in
`buildCall()` throw.

| `XcIntentsError`           | Guard                                                     |
| -------------------------- | --------------------------------------------------------- |
| `RecipientRejected`        | router's prefix check, `path_of`, or NEAR account lookup  |
| `InvalidRefundAddress`     | `refundTo` not a checksummed Ethereum address             |
| `Unpriced`                 | dispatcher has no live rate for the destination           |
| `BelowExistentialDeposit`  | amount per trade under the input asset's ED               |
| `OrderTooSmall`            | `minWethOut < least`, or under WETH's ED                  |
| `MinDeliveryBelowRouteMin` | TWAP `minDelivery` under the route minimum                |
| `InvalidPeriod`            | TWAP period under 15 blocks                               |
| `InvalidTranches`          | TWAP tranche count not a positive integer                 |
| `WethTwap`                 | TWAP selling WETH, which ICE refuses                      |

Shielded Zcash addresses (`zs…`, `u1…`) are rejected as recipients.

## Closing

`closeCalls(terms, delay)` returns `dispatcher.close(terms, delay)` from the owner, paying the
Wormhole message fee. `delay` is at most a day (default 1 h, so orders in flight still fill). After
it, the router pays out `A` and refunds its ETH.

The ICE intent keeps trading until removed: the caller batches `Intent.remove_intent(id)` with the
close. `close` needs the exact terms: persist them, or decode them from scan with
`termsFromTrade(await intents.trade(authPath))`.

## Constants

```
Dispatcher (Hydration EVM)  0x2c967d7e00a18c1c926fd77de733a27c3fdb3f2b
Router (NEAR)               intents-router.hydration-whm.near
MPC signer (NEAR)           v1.signer, ed25519 domain 1
WETH                        asset 20, precompile 0x…0100000014

ZEC   nep141:zec.omft.near     route min 100,000 zat, payout fee 20,000 zat
BTC   nep141:nbtc.bridge.near  route min 6,400 sat, payout fee 400 sat + miner (825 sat at 5 sat/vB)
NEAR  nep141:wrap.near         paid as native NEAR, no minimum
```

Route minimums are read live from the router's `utxo_routes`. Every address and URL is overridable
through `XcIntentsOpts`.

## Layout

```
src/
  factory.ts            createXcIntents(opts) -> XcIntentsClient
  client.ts             destinations, validateRecipient, swap, twap, closeCalls, trade
  types.ts              public types and XcIntentsError
  consts.ts             addresses, protocol constants, defaults
  scan.ts               trade lookup, terms from scan
  dispatcher/           intents v2 dispatcher (Hydration EVM)
    IntentDispatcher.ts reads, encoding cross-check
    abi.ts              dispatcher, order cost, ERC-20
    utils.ts            forward data
  router/               intents router (NEAR)
    IntentRouter.ts     UTXO routes, A derivation, recipient checks
  quote/
    relayFee.ts         relay ceiling
    oneClick.ts         1Click config, deposit to A, deposit check
  terms/                Terms, codec, builders, golden fixture
  trade/
    estimate.ts         shared estimate
    request.ts          buildCall
    swap.ts, twap.ts    schedule, deadlines and ICE builder per kind
    builder.ts          dispatch and close EvmCalls
    close.ts            closeCalls
    utils.ts            sizing (least, floor and expected output), slippage
```

## Verification

- `npm run build` and `npm test` in the package. Unit tests mock the EVM `readContract`, NEAR views,
  the quoter `fetch` and 1Click's `getQuote`.
- The codec is checked against the golden vector from whm's `IntentCodecTest.sol`.
- `test/script/dryRun.ts` estimates and builds swaps to ZEC, BTC and NEAR and a TWAP on mainnet, and
  dry-runs each intent and the close calldata. Nothing is submitted.

## Known gaps

- The WETH `dispatch` path and EVM-wallet owners have not run on chain.
