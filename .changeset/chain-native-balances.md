---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-cfg': minor
---

Chain-native balance reads

Each chain now reads its own balances, so any asset's balance can be read
directly from a chain — no `Wallet`, `ConfigService`, route or `PlatformAdapter`
required. This makes chains reusable as a standalone read surface (e.g. for
`xc-swap`) and lets a new chain be added by declaring data only, without
touching the transfer-oriented platform interface.

- `xc-core`: balance reads are declarative, typed per platform. A chain
  registers a storage type via `balance` / `balanceOverrides` using the enum for
  its platform — `SubstrateBalanceType`, `EvmBalanceType`, `SolanaBalanceType`
  or `SuiBalanceType` (`BalanceType` is their union) — so a chain can only
  declare storage types its own client supports. The old `BalanceConfigBuilder`
  / `BalanceBuilder` / `AssetMinBuilder` builders and the intermediate
  query-config DTOs (`SubstrateQueryConfig`, `Solana/SuiQueryConfig`,
  `MinConfigBuilder`) are gone.
- `xc-core`: each chain owns a per-platform balance client (substrate / evm /
  solana / sui under `chain/balance`) and implements `getBalance(asset, address)`
  and `subscribeBalance` polymorphically. `Chain` also provides
  `subscribeBalances(assets, address)` — a merged multi-asset stream — and
  `getBalanceType`. The substrate client also reads the per-asset minimum
  (declared via `SubstrateMinType`) and the existential deposit, surfaced on
  `Parachain` as `getMin` / `getEd`. Adds `rxjs` as a peer dep.
- `xc-sdk`: the platform-side balance code is **removed** — `getBalance` /
  `subscribeBalance` are gone from the `Platform` interface, `PlatformAdapter`
  and every `*Platform`, and the `platforms/*/balance` factories are deleted.
  Balance/min/ed are read straight off the chain. `DataProcessor` is now the
  shared base for both `DataOriginProcessor` and `DataDestinationProcessor`
  (each resolves `(chain, asset)` → balance/min/ed from the chain), and
  `Wallet.subscribeBalance` delegates to `chain.subscribeBalances`.
- `xc-cfg`: every chain definition declares `balance: <Platform>BalanceType.X`
  (plus `balanceOverrides`, and `min: SubstrateMinType.Assets` for the
  AssetHubs). Route declarations are unchanged.
