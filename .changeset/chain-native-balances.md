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

- `xc-core`: balance reads are declarative. A chain registers a `BalanceType`
  (and, for substrate, an optional `MinType`) per asset via `balance` /
  `balanceOverrides`; the config builders (`BalanceConfigBuilder`,
  `BalanceBuilder`, `AssetMinBuilder`) and intermediate config DTOs are gone.
- `xc-core`: each chain owns a per-platform balance client (substrate / evm /
  solana / sui under `chain/balance`) and implements `getBalance(asset, address)`
  and `subscribeBalance` polymorphically. `Chain` also provides
  `subscribeBalances(assets, address)` — a merged multi-asset stream — and
  `getBalanceType`. Substrate minimum + existential deposit (`getMin`,
  `getExistentialDeposit`) live on `Parachain` only. Adds `rxjs` as a peer dep.
- `xc-sdk`: `DataProcessor`, `DataDestinationProcessor`, `DataOriginProcessor`
  fee reads and `Wallet.subscribeBalance` delegate to the chain (narrowing to
  `Parachain` for min/ed). The platform balance code is retained (unused) for
  now and removed in a later cleanup, so this change is non-breaking.
- `xc-cfg`: every chain definition declares `balance: BalanceType.X` (plus
  `balanceOverrides` / `min: MinType.Assets`). Route declarations are unchanged.
