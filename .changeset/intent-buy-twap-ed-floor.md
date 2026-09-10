---
"@galacticcouncil/sdk-next": minor
---

Intent tx builders for ICE:

- `IntentMarketTxBuilder`: build a Buy as a sell-shaped exact-in `Swap` intent
  (pad `amount_in`, keep `amount_out` exact) alongside Sell.
- `IntentOrderTxBuilder`: use the asset ED as the per-slice `amount_out` floor
  instead of a frozen `min_amount_out`, and clamp `period` to the runtime
  `MinDcaPeriod`. DCA/TWAP orders are then gated by the pallet's live oracle
  band and can't zombie once price drifts.
