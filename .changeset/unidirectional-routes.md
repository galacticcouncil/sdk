---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-cfg': minor
---

Unidirectional routes: chain-level balance/min registry & route simplification

The chain is now the single source of truth for how to read an asset's balance
and minimum. Reverse routes are optional, which unblocks one-way transfers, and
route templates no longer carry balance/min builders.

Phase 1 — chain registry & one-way routes:

- `xc-core`: base `Chain` gains a balance/min registry — `balance` (required),
  `balanceOverrides`, optional `min` — resolved per asset (finalized in the
  chain-native-balances change as the declarative `getBalanceType(asset)` +
  `getMin` / `getEd`).
- `xc-core`: `TransferConfigs` drops `reverse` for a `reversible: boolean` flag;
  `ConfigBuilder.build()` no longer throws when no reverse route exists. Added
  non-throwing `getAssetRoutesOrEmpty` / `getAssetDestinationRoutesOrEmpty`.
- `xc-sdk`: `DataReverseProcessor` replaced by `DataDestinationProcessor`, which
  reads destination balance/min/ed from the destination chain registry. The
  `Transfer` DTO gains a `reversible` flag.
- `xc-cfg`: every chain declares its `balance` (and `balanceOverrides` / `min`).

Phase 2 — route simplification:

- `xc-core`: `SourceConfig`, `FeeConfig` and `TransactFeeConfig` lose their
  `balance` builders; `SourceConfig` loses `min`; `source.destinationFee`
  collapses from `{ asset?, balance }` to an optional `Asset` (fee-asset
  override).
- `xc-sdk`: all balance read sites (origin balance/min, source fee, destination
  fee, transact fee, `subscribeBalance`) now resolve builders from the chain
  registry instead of the route.
- `xc-cfg`: `source.balance` / `source.min` / `source.fee.balance` /
  `source.destinationFee.balance` / `transact.fee.balance` removed from every
  route template and definition.

Migration:

- Consumers reading `configs.reverse.*` should take the destination chain/asset
  from `configs.origin.route.destination` and use the new `reversible` flag.
- Anyone constructing `Chain` subclasses must pass `balance`. Anyone building
  `AssetRoute`s directly must drop the removed `balance`/`min` fields and pass
  `source.destinationFee` as a bare `Asset` (or omit it).
