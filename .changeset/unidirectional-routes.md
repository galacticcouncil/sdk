---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-cfg': minor
---

Unidirectional routes & chain-native balance reads

The chain is now the single source of truth for an asset's balance, minimum and
existential deposit, and reads them itself. Reverse routes are optional (one-way
transfers work), route templates no longer carry balance/min builders, and any
asset's balance can be read directly from a chain — no `Wallet`,
`ConfigService`, route or `PlatformAdapter`:

```ts
const amount = await chain.getBalance(asset, address); // AssetAmount
```

This makes a chain a reusable read surface (e.g. for `xc-swap`) and lets a new
chain be added by declaring data only.

Routes

- `xc-core`: `TransferConfigs` drops `reverse` for a `reversible: boolean` flag;
  `ConfigBuilder.build()` no longer throws when no reverse route exists. Added
  non-throwing `getAssetRoutesOrEmpty` / `getAssetDestinationRoutesOrEmpty`.
- `xc-core`: `SourceConfig`, `FeeConfig` and `TransactFeeConfig` lose their
  `balance` builders; `SourceConfig` loses `min`; `source.destinationFee`
  collapses from `{ asset?, balance }` to an optional `Asset` (fee-asset
  override).
- `xc-sdk`: `DataReverseProcessor` is replaced by `DataDestinationProcessor`; the
  `Transfer` DTO gains a `reversible` flag.

Declarative, per-platform balances (`xc-core`)

- A chain declares how each asset's balance is stored via `balance` /
  `balanceOverrides`, using the enum for its platform — `SubstrateBalanceType`,
  `EvmBalanceType`, `SolanaBalanceType`, `SuiBalanceType` (`BalanceType` is their
  union) — so a chain can only declare storage types its own client supports.
  The substrate dynamic minimum is declared via `SubstrateMinType`.
- Each chain owns a per-platform balance client under `chain/balance` and
  implements `getBalance(asset, address)`, `subscribeBalance` and
  `subscribeBalances(assets, address)` (a merged multi-asset stream); `Parachain`
  adds `getMin` / `getEd`. Adds `rxjs` as a peer dep.
- The old builders (`BalanceBuilder`, `AssetMinBuilder`, `BalanceConfigBuilder`,
  `MinConfigBuilder`) and the query-config DTOs (`SubstrateQueryConfig`,
  `Solana/SuiQueryConfig`) are removed.

`xc-sdk`

- The platform-side balance code is removed: `getBalance` / `subscribeBalance`
  are gone from the `Platform` interface, `PlatformAdapter` and every `*Platform`,
  and the `platforms/*/balance` factories are deleted. `Platform` keeps only
  `buildCall` / `estimateFee`.
- `DataProcessor` is the shared base for both `DataOriginProcessor` and
  `DataDestinationProcessor`; both resolve balance/min/ed straight off the chain
  (origin from its `TransferConfig`, destination from constructor args).
  `Wallet.subscribeBalance` delegates to `chain.subscribeBalances`.

`xc-cfg`

- Every chain definition declares `balance: <Platform>BalanceType.X` (plus
  `balanceOverrides`, and `min: SubstrateMinType.Assets` for the AssetHubs).
  Route templates drop `source.balance` / `source.min` / `*.fee.balance` /
  `source.destinationFee.balance` / `transact.fee.balance`.

Migration

- Reading `configs.reverse.*`: take the destination chain/asset from
  `configs.origin.route.destination` and use the `reversible` flag.
- Constructing `Chain` subclasses: pass `balance` using the platform enum.
  Building `AssetRoute`s directly: drop the removed `balance` / `min` fields and
  pass `source.destinationFee` as a bare `Asset` (or omit it).
- Reading balances no longer needs `xc-sdk` — use `chain.getBalance` /
  `chain.subscribeBalances` and `chain.getMin` / `chain.getEd`.
