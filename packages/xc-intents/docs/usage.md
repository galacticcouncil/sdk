# Usage — `xc-intents`

How to integrate Intents v2: swap or TWAP any Hydration asset into ZEC, BTC or NEAR, paid out on
its own chain, in one Hydration signature.

The SDK estimates and builds calls. It never signs or submits. For the protocol behind it, see
[`spec.md`](./spec.md).

## Install

```sh
npm i @galacticcouncil/xc-intents
```

Peer dependencies: `@galacticcouncil/common`, `descriptors` (≥ 2.11.0), `sdk-next` (≥ 2.7.0),
`xc-core`, `xc-sdk`, `polkadot-api`, `viem`.

## Setup

```ts
import { createSdkContext } from '@galacticcouncil/sdk-next';
import { createXcIntents } from '@galacticcouncil/xc-intents';

const sdk = await createSdkContext(papiClient);
const intents = createXcIntents({ sdk });
```

Only `sdk` is required. The rest default to mainnet:

| Option           | Default                                      |
| ---------------- | -------------------------------------------- |
| `oneClick`       | 1Click API with xc-swap's distribution token |
| `near`           | `NearClient` on `nearRpc`                    |
| `nearRpc`        | `https://free.rpc.fastnear.com`              |
| `dispatcher`     | `0x2c967d7e00a18c1c926fd77de733a27c3fdb3f2b` |
| `router`         | `intents-router.hydration-whm.near`          |
| `mpcSigner`      | `v1.signer`                                  |
| `quoterUrl`      | `https://quoter-intent.play.hydration.cloud` |
| `scanUrl`        | `https://scan.play.hydration.cloud/api/v2`   |
| `relayMarginBps` | 2000 (+20% on the relay fee ceiling)         |

The 1Click client is configured globally and shared with xc-swap: the client created last sets it.

## Destinations

```ts
const destinations = await intents.destinations();
// [{ symbol: 'ZEC', asset: 'nep141:zec.omft.near', decimals: 8,
//    outPerIn, routeMin: 100_000n, payoutFee: 20_000n }, …]
```

Only destinations the dispatcher prices right now are returned. Use `asset` as `destination` in
trade params. `routeMin` is the least the router pays out at once (0 for NEAR).

## Recipients

```ts
await intents.validateRecipient('nep141:zec.omft.near', 't1…'); // throws when rejected
```

- Withdraw (default): an address on the asset's chain. Transparent Zcash only: `zs…` and `u1…`
  are rejected.
- `RecipientKind.IntentsAccount`: a NEAR intents account, which must exist.

`swap` and `twap` run the same check and report `RecipientRejected` instead of throwing.

## Swap

```ts
const trade = await intents.swap({
  account: '7L53…', // Hydration account signing
  assetIn: 5, // Hydration runtime asset id
  amountIn: 10_000_000_000n, // smallest unit
  destination: 'nep141:zec.omft.near',
  recipient: 't1…',
  refundTo: '0x…', // checksummed Ethereum address
});
```

Optional params:

| Param            | Default  | Meaning                                         |
| ---------------- | -------- | ----------------------------------------------- |
| `recipientKind`  | Withdraw | `RecipientKind.IntentsAccount` for NEAR intents |
| `slippage`       | 1        | Percent under the quoted WETH                   |
| `floorBps`       | 2000     | Hard floor under the live rate                  |
| `maxSlippageBps` | 300      | Slippage the router may quote under             |
| `deadlineMin`    | 60       | ICE intent lifetime, minutes                    |

### What to show

| Field               | Meaning                                                |
| ------------------- | ------------------------------------------------------ |
| `amountOut`         | Expected output, destination units                     |
| `minAmountOut`      | Worst accepted output, at the hard floor               |
| `least` / `leastIn` | Least WETH per order, and the same in the input asset  |
| `fees.maxRelayFee`  | Relay ceiling per order, wei                           |
| `fees.orderCost`    | Bridge delivery plus Wormhole fee per order, wei       |
| `fees.payout`       | Payout fee on the destination chain, destination units |
| `errors`            | Viability problems; empty when executable              |

Use `leastIn` as the minimum amount in the input field.

## TWAP

```ts
const trade = await intents.twap({
  ...params,
  amountIn: 120_000_000_000n, // total
  tranches: 12,
  period: 150, // blocks between trades, at least 15
  minDelivery: 300_000n, // optional
});
```

- Each trade sells `amountIn / tranches`; the remainder stays with the user.
- Each trade is sized like a swap, so every one pays out on its own: `amountInPerTrade` must reach
  `leastIn`.
- `minDelivery` batches payouts: the router waits until `A` holds that much. It must be at least
  the route minimum.
- `amountOut`, `minAmountOut` are totals over all trades; `fees` are per order.
- A TWAP has no ICE deadline. It runs until its trades are done or it is closed.

## Build and sign

```ts
if (trade.errors.length) return; // show them instead

const req = await trade.buildCall();
```

`buildCall()` fixes the terms (fresh quote id, deadlines from now), derives the deposit account `A`,
makes the 1Click deposit and re-reads the relay fee. It throws when the order no longer clears
`least`, e.g. after gas rose: estimate again then.

Call `buildCall()` only when the user confirms. Every call creates a new action and a new 1Click
deposit.

```ts
if (req.kind === 'intent') {
  // ICE intent forwarded to the dispatcher (sdk-next Tx)
  await req.tx.dryRun(account);
  await req.tx.get().signSubmitAndWatch(signer);
} else {
  // Selling WETH itself: [approve?, dispatch] EvmCalls from the owner
  req.calls;
}
```

Persist `req.terms` and `req.authPath`. Closing needs the exact terms, and scan looks trades up by
`authPath`. Other fields: `depositAccount` (`A` on NEAR), `depositAddress` (1Click address on
Ethereum), `maxRelayFee`.

## Errors

Reported in `trade.errors`. Unsupported assets, network failures and failed checks in
`buildCall()` throw.

| `XcIntentsError`           | Cause                                            | Fix for the user                    |
| -------------------------- | ------------------------------------------------ | ----------------------------------- |
| `RecipientRejected`        | Router would not pay the recipient               | Change the recipient                |
| `InvalidRefundAddress`     | `refundTo` is not a checksummed Ethereum address | Change the refund address           |
| `Unpriced`                 | Dispatcher has no live rate for the destination  | Try later                           |
| `BelowExistentialDeposit`  | Amount per trade under the input asset's ED      | Raise the amount                    |
| `OrderTooSmall`            | WETH per order under `least`                     | Raise to `leastIn` per trade        |
| `MinDeliveryBelowRouteMin` | TWAP `minDelivery` under the route minimum       | Raise `minDelivery`                 |
| `InvalidPeriod`            | TWAP period under 15 blocks                      | Raise `period`                      |
| `InvalidTranches`          | TWAP tranche count not a positive integer        | Fix `tranches`                      |
| `WethTwap`                 | TWAP selling WETH, which ICE refuses             | Swap instead, or pick another asset |

## Close a TWAP

```ts
const calls = await intents.closeCalls(req.terms, 3600); // [close] from the owner
```

- `delay` is seconds, 0..86400 (default 3600), so orders in flight still fill.
- After it, the router pays out `A` and refunds its ETH to `refundTo`.
- The ICE intent keeps trading until removed: batch `Intent.remove_intent({ id })` with the close.
- Throws when the terms are already closed.

Without persisted terms, decode them from scan:

```ts
import { termsFromTrade } from '@galacticcouncil/xc-intents';

const scanned = await intents.trade(authPath);
if (scanned) await intents.closeCalls(termsFromTrade(scanned));
```

## Track

```ts
const scanned = await intents.trade(authPath); // undefined when unknown
scanned?.trade.status; // 'pending' | 'closing' | 'completed' | 'refunded' | 'expired'
scanned?.orders;
scanned?.payouts;
```

## Units

- Amounts are bigints in the smallest unit: input asset decimals, wei for WETH and fees, destination
  decimals for outputs.
- `slippage` is percent (1 = 1%), as in sdk-next. `floorBps` and `maxSlippageBps` are bps.
- The relay fee follows Ethereum gas and changes several times a day: re-estimate before showing a
  stale quote.
