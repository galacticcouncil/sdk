---
'@galacticcouncil/sdk-next': minor
---

Sell-intent TWAP orders now execute as a `Sell` with `min_amount_out = 0`, delegating per-slice price protection to the pallet's adaptive oracle slippage limit (same as DCA). This removes the frozen-floor stall (`TradeLimitReached`) that stranded large sell orders such as big-bag exits. Buy-intent TWAP is unchanged (still built as a `Buy` with a guaranteed output).
