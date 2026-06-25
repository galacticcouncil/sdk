---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-cfg': minor
---

Unidirectional routes (phase 1): chain-level balance/min registry & one-way transfer support

- `xc-core`: the base `Chain` now owns a balance/min registry — `balance` (required),
  `balanceOverrides`, and optional `min` params with `getBalanceBuilder(asset)` /
  `getMinBuilder()` accessors. The chain is now the source of truth for how to read an
  asset's balance/min, instead of relying on reverse-route symmetry.
- `xc-core`: `TransferConfigs` drops `reverse` in favour of a `reversible: boolean` flag,
  and `ConfigBuilder.build()` no longer throws when no reverse route exists (one-way routes
  resolve with `reversible=false`). Added `getAssetRoutesOrEmpty` /
  `getAssetDestinationRoutesOrEmpty` non-throwing lookups.
- `xc-sdk`: `DataReverseProcessor` is replaced by `DataDestinationProcessor`, which reads
  destination balance/min/ed from the destination chain registry rather than a reverse
  `TransferConfig`. The `Transfer` DTO gains a `reversible` flag.
- `xc-cfg`: every chain definition now declares its `balance` (and `balanceOverrides` / `min`
  where applicable). Route declarations are unchanged.

Migration: consumers reading `configs.reverse.*` should take the destination chain/asset from
`configs.origin.route.destination` and use the new `reversible` flag.
