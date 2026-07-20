# @galacticcouncil/xc-sdk

## 1.3.0

### Minor Changes

- 23af67e: Unidirectional routes & chain-native balance reads

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

### Patch Changes

- Updated dependencies [23af67e]
  - @galacticcouncil/xc-core@1.3.0

## 1.2.2

### Patch Changes

- xc: fix solana claim (chunks)

## 1.2.1

### Patch Changes

- 5d923e6: WUD xcm fix and assethub_cex routes fix
- Updated dependencies [5d923e6]
  - @galacticcouncil/xc-core@1.2.1

## 1.2.0

### Minor Changes

- Updated dependencies
  - @galacticcouncil/xc-core@1.2.0

## 1.1.2

### Patch Changes

- 2c0b9f6: Snowbridge v1 implementation in paralel with v2

## 1.1.1

### Patch Changes

- 310086e: Fixed claim script

## 1.1.0

### Minor Changes

- 9a867af: Snowbridge migration from V1 to V2

### Patch Changes

- Updated dependencies [9a867af]
  - @galacticcouncil/xc-core@1.1.0

## 1.0.0

### Major Changes

- 1281cfa: polkadot api v2 migration

### Patch Changes

- Updated dependencies [1281cfa]
  - @galacticcouncil/xc-core@1.0.0

## 0.11.0

### Minor Changes

[d27ab087]: https://github.com/galacticcouncil/sdk/commit/d27ab087
[ce812808]: https://github.com/galacticcouncil/sdk/commit/ce812808
[40cc4afd]: https://github.com/galacticcouncil/sdk/commit/40cc4afd

- [[#d27ab087][d27ab087]] xc: support tag filtering (bridge opts)
- [[#ce812808][ce812808]] xc: basejump cleanup
- [[#40cc4afd][40cc4afd]] xc: basejump base eurc

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.15.0

## 0.10.1

### Patch Changes

- eb9af28: Removal of fee re-estimation

## 0.10.0

### Minor Changes

- chore: re-moduling

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.14.0

## 0.9.2

### Patch Changes

- 3ac6e78: fixed max fee calc

## 0.9.1

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.13.0

## 0.9.0

### Minor Changes

- get rid of xLabs

## 0.8.0

### Minor Changes

[9996c4c9]: https://github.com/galacticcouncil/sdk/commit/9996c4c9
[f381a24c]: https://github.com/galacticcouncil/sdk/commit/f381a24c
[dee4c0fa]: https://github.com/galacticcouncil/sdk/commit/dee4c0fa

- [[#9996c4c9][9996c4c9]] xc: evm signer fix
- [[#f381a24c][f381a24c]] xc: support sui claim
- [[#dee4c0fa][dee4c0fa]] xc: fix sui signer

## 0.7.0

### Minor Changes

[d36a2dbb]: https://github.com/galacticcouncil/sdk/commit/d36a2dbb

- [[#d36a2dbb][d36a2dbb]] xc: add platform signers to sdk

## 0.6.0

### Minor Changes

[ac327f5d]: https://github.com/galacticcouncil/sdk/commit/ac327f5d

- [[#ac327f5d][ac327f5d]] xc: move account utils to common

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.12.0

## 0.5.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.11.0

## 0.5.1

### Patch Changes

[e6217edd]: https://github.com/galacticcouncil/sdk/commit/e6217edd
[0eb8017a]: https://github.com/galacticcouncil/sdk/commit/0eb8017a

- [[#e6217edd][e6217edd]] xc: fix max transfer from SUI
- [[#0eb8017a][0eb8017a]] xc: changed init amount in transfer to 10 satoshis

## 0.5.0

### Minor Changes

[f2b52124]: https://github.com/galacticcouncil/sdk/commit/f2b52124
[9424cbdd]: https://github.com/galacticcouncil/sdk/commit/9424cbdd

- [[#f2b52124][f2b52124]] xc: moved rentReserve to feeCalc
- [[#9424cbdd][9424cbdd]] xc: fix calculateMax function for solana (rentReserve fee)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.10.0

## 0.4.5

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.9.0

## 0.4.4

### Patch Changes

[80475436]: https://github.com/galacticcouncil/sdk/commit/80475436

- [[#80475436][80475436]] xc: substrate balance watcher at best

- Updated dependencies
  - @galacticcouncil/xc-core@0.8.0

## 0.4.3

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.7.0

## 0.4.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.6.0

## 0.4.1

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.5.0

## 0.4.0

### Minor Changes

- rework peer deps

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.4.0

## 0.3.0

### Minor Changes

- bump common to 0.1.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.3.0

## 0.2.0

### Minor Changes

- Re-vamp v2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.2.0

## 0.1.0

Initial papi refactor
