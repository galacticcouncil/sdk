# Intent Tx Builders

Submittable transaction builders for the `Intent` pallet (ICE protocol). All builders are constructed via `TxBuilderFactory` and follow the same fluent API as `TradeTxBuilder` / `OrderTxBuilder`.

Builders auto-wrap the call with `Dispatcher.dispatch_with_extra_gas` when the beneficiary has active Aave borrow positions.

## Factory

```ts
import { TxBuilderFactory } from '@galacticcouncil/sdk-next';

const factory = new TxBuilderFactory(client, evmClient);

factory.intentMarket(trade);   // IntentMarketTxBuilder
factory.intentLimit(trade);    // IntentLimitTxBuilder
factory.intentOrder(order);    // IntentOrderTxBuilder
```

## IntentMarketTxBuilder

Submits a market swap intent. Min amount out is derived from `slippagePct` (default `1`).

```ts
const tx = await factory
  .intentMarket(trade)
  .withBeneficiary(address)
  .withSlippage(0.5)
  .build();

await tx.dryRun(address);
tx.get(); // -> Transaction (decodedCall)
```

Emits: `IntentSwap`.

## IntentLimitTxBuilder

Submits a limit-order intent. Either provide an explicit `minAmountOut`, or fall back to `trade.amountOut`. `partial` controls partial fill (default `true`).

```ts
const tx = await factory
  .intentLimit(trade)
  .withBeneficiary(address)
  .withMinAmountOut(1_000_000_000_000n)
  .withPartial(false)
  .build();
```

Emits: `IntentLimitOrder`.

## IntentOrderTxBuilder

Submits a scheduled intent. Dispatches by `TradeOrder.type`:

| `TradeOrderType` | Tx name                  | Notes                                  |
|------------------|--------------------------|----------------------------------------|
| `Dca`            | `IntentDcaSchedule`      | `amount_out = 1n` (no min)             |
| `TwapSell`       | `IntentDcaSchedule.twap` | `amount_out` derived from slippage     |
| `TwapBuy`        | `IntentDcaSchedule.twap` | `amount_out` derived from slippage     |

```ts
const tx = await factory
  .intentOrder(order)        // TradeOrder from sor
  .withBeneficiary(address)
  .withSlippage(1)
  .build();
```

Slippage is encoded on-chain as `slippagePct * 10_000` (basis-points × 100).

## Tx shape

All `.build()` calls return:

```ts
type Tx = {
  name: string;
  get(): Transaction;
  dryRun(account: string): Promise<DryRunResult>;
};
```

`dryRun` calls `DryRunApi.dry_run_call` and throws with the module error path on failure.

## Requirements

- `withBeneficiary(...)` is required — used for Aave debt check.
- The underlying chain api is `apiIce` (`hydrationIce` descriptor) — make sure descriptors are built (`packages/descriptors`).
