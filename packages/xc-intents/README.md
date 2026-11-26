# @galacticcouncil/xc-intents

Cross-chain intents SDK for Hydration — **Intents v2**.

It lets a Hydration user swap or TWAP any Hydration asset into **ZEC**, **BTC** or **NEAR**, paid
out on the asset's own chain, in one Hydration signature. Each trade is an ICE intent that sells into
WETH and forwards it to the intents v2 dispatcher, which bridges it to a NEAR deposit account `A`
derived for the trade's terms. The router on NEAR swaps it through 1Click and pays the recipient.

Like `xc-swap`, the SDK only estimates and builds calls. It never submits.

## Usage

```ts
import { createSdkContext } from '@galacticcouncil/sdk-next';
import { createXcIntents } from '@galacticcouncil/xc-intents';

const sdk = await createSdkContext(papiClient);

const intents = createXcIntents({ sdk }); // optional: oneClick: { baseUrl, jwt }

await intents.destinations(); // ZEC, BTC, NEAR with live rates and route minimums
await intents.validateRecipient('nep141:zec.omft.near', 't1…');

// Estimate a swap: amounts, fees and viability.
const trade = await intents.swap({
  account: '7L53…',                  // Hydration account signing
  assetIn: 5,                        // Hydration runtime asset id
  amountIn: 10_000_000_000n,         // smallest unit
  destination: 'nep141:zec.omft.near',
  recipient: 't1…',                  // Zcash address
  refundTo: '0x…',                   // Ethereum address for ETH refunds
});

// Viability is reported, not thrown.
if (trade.errors.length) return;

// Fix the terms and build what the owner signs.
const req = await trade.buildCall();
if (req.kind === 'intent') {
  await req.tx.dryRun(account);      // sdk-next Tx: ICE intent forwarded to the dispatcher
} else {
  req.calls;                         // selling WETH itself: [approve?, dispatch] EvmCalls
}

// Persist req.terms (or req.authPath) to close or look the trade up later.
```

A TWAP takes the total and splits it over `tranches` trades, `period` blocks apart:

```ts
const twap = await intents.twap({
  ...params,
  amountIn: 120_000_000_000n,        // total; each trade sells amountIn / tranches
  tranches: 12,
  period: 150,                       // blocks, at least 15
  minDelivery: 300_000n,             // optional: batch payouts above the route minimum
});
```

End a TWAP early with `closeCalls` and remove its ICE intent in the same batch:

```ts
const calls = await intents.closeCalls(req.terms, 3600); // [close] from the owner
// + Intent.remove_intent({ id }) on Hydration
```

## Notes

- `amountIn` is the total sold. A TWAP sells `amountIn / tranches` per trade; the remainder stays
  with the user.
- Every order, swap or TWAP tranche, must sell at least `trade.least` WETH so it pays out on its own.
  `trade.leastIn` gives that minimum in the input asset.
- `slippage` is in **percent** (1 = 1%), as in `sdk-next`. `floorBps` and `maxSlippageBps` are bps.
- `buildCall()` re-reads the relay fee ceiling and refuses when it rose past the order. Estimate
  again then.
- Fees outside the user's slippage are in `trade.fees`: the relay ceiling, the dispatcher's order
  cost, and the payout fee on the destination chain.
- `intents.trade(authPath)` fetches a trade from scan; `termsFromTrade` decodes its terms for close.
- See [`docs/spec.md`](./docs/spec.md) for the full design.
