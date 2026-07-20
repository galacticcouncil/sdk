# @galacticcouncil/xc-core

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

## 1.2.1

### Patch Changes

- 5d923e6: WUD xcm fix and assethub_cex routes fix

## 1.2.0

### Minor Changes

- bump papi to latest

## 1.1.1

### Patch Changes

- 2c0b9f6: Snowbridge v1 implementation in paralel with v2

## 1.1.0

### Minor Changes

- 9a867af: Snowbridge migration from V1 to V2

## 1.0.0

### Major Changes

- 1281cfa: polkadot api v2 migration

### Patch Changes

- Updated dependencies [1281cfa]
  - @galacticcouncil/descriptors@2.0.0
  - @galacticcouncil/common@1.0.0

## 0.15.0

### Minor Changes

[d27ab087]: https://github.com/galacticcouncil/sdk/commit/d27ab087
[ce812808]: https://github.com/galacticcouncil/sdk/commit/ce812808
[40cc4afd]: https://github.com/galacticcouncil/sdk/commit/40cc4afd

- [[#d27ab087][d27ab087]] xc: support tag filtering (bridge opts)
- [[#ce812808][ce812808]] xc: basejump cleanup
- [[#40cc4afd][40cc4afd]] xc: basejump base eurc

## 0.14.0

### Minor Changes

- chore: re-moduling

## 0.13.0

### Minor Changes

- Bump peer deps

## 0.12.0

### Minor Changes

[3d12d2fb]: https://github.com/galacticcouncil/sdk/commit/3d12d2fb
[ac327f5d]: https://github.com/galacticcouncil/sdk/commit/ac327f5d

- [[#3d12d2fb][3d12d2fb]] xc: move substrateApis to common
- [[#ac327f5d][ac327f5d]] xc: move account utils to common

## 0.11.0

### Minor Changes

[f151df14]: https://github.com/galacticcouncil/sdk/commit/f151df14

- [[#f151df14][f151df14]] xc: changed withSdkCompat to legacyEnhancer

## 0.10.0

### Minor Changes

[f2b52124]: https://github.com/galacticcouncil/sdk/commit/f2b52124
[9424cbdd]: https://github.com/galacticcouncil/sdk/commit/9424cbdd

- [[#f2b52124][f2b52124]] xc: moved rentReserve to feeCalc
- [[#9424cbdd][9424cbdd]] xc: fix calculateMax function for solana (rentReserve fee)

## 0.9.0

### Minor Changes

[d144fa70]: https://github.com/galacticcouncil/sdk/commit/d144fa70

- [[#d144fa70][d144fa70]] xc: added sdkCompat to parachains not supporting papi fully

## 0.8.0

### Minor Changes

[dfd596b5]: https://github.com/galacticcouncil/sdk/commit/dfd596b5
[804aae92]: https://github.com/galacticcouncil/sdk/commit/804aae92

- [[#dfd596b5][dfd596b5]] xc: substrate apis health probe
- [[#804aae92][804aae92]] bump papi to latest (1.23.3)

## 0.7.0

### Minor Changes

[01ebee31]: https://github.com/galacticcouncil/sdk/commit/01ebee31
[295aa7bb]: https://github.com/galacticcouncil/sdk/commit/295aa7bb

- [[#01ebee31][01ebee31]] xc: removing xtokens from moonbeam
- [[#295aa7bb][295aa7bb]] xc: PolkadotXCM moonbeam implementation

## 0.6.0

### Minor Changes

[f4c70f0d]: https://github.com/galacticcouncil/sdk/commit/f4c70f0d

- [[#f4c70f0d][f4c70f0d]] bump papi to latest (1.23.2)

## 0.5.0

### Minor Changes

[a3a6285b]: https://github.com/galacticcouncil/sdk/commit/a3a6285b

- [[#a3a6285b][a3a6285b]] xc: updated SubstrateApis to have getWs function and ws in the cache

## 0.4.0

### Minor Changes

- rework peer deps

## 0.3.0

### Minor Changes

- bump common to 0.1.2

## 0.2.0

### Minor Changes

- Re-vamp v2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.2.0

## 0.1.0

Initial papi refactor
