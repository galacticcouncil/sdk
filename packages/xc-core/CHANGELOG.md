# @galacticcouncil/xc-core

## 2.3.0

### Minor Changes

- c9684bd: Wormhole NTT executor delivery & rate limits.
  - **Executor delivery** — the sender pays for destination delivery instead of signing a
    redeem there. Offered alongside the self-redeem route for the same pair. Hydration
    calls the manager and the Executor directly rather than through the shim, whose
    unbounded approve its erc20 precompile rejects.
  - **Rate limits** — per-token NttManager 24h inbound/outbound limits are read and
    validated before a transfer is built, so a capped transfer fails up front instead of
    reverting on redeem.
  - **NTT clients per platform** — one client interface over the evm, solana and sui
    deployments, replacing the per-call-site branching.
  - **Solana** — jito bundle endpoints, token-2022 associated token accounts, and ata
    derivation shared through `xc-core`. A redeem now opens the recipient's ata, not only
    the payer's.
  - Destination fee swap is sized to the fee plus existential deposit, and source fee
    estimation covers the whole call sequence rather than the transfer alone.

  Call builders return an ordered config vector instead of hanging
  `prior`/`follow`/`prerequisites` off the configs themselves, and hydration's ss58 leg
  becomes an `ExtrinsicBuilder().evm().call()` extrinsic, so a route composes it with the
  rest of its batch and the fee is quoted by the runtime in the sender's fee currency.

  The MRL transact surface is dropped along with it — nothing has declared
  `AssetRoute.transact` since MRL was removed, so every path behind it was dead.

## 2.2.0

### Minor Changes

- 9e041f4: Faster, leaner balance reads:
  - Assets in account-keyed storage (`Tokens` / `OrmlTokens`) are read in batch —
    one `watchEntries` subscription (or one storage read) covers every asset in
    the map instead of one per asset.
  - New `Chain.getBalances(assets, address)` and `Chain.getAssets()` for one-shot
    snapshots (e.g. asset pickers); `subscribeBalances` stays for live updates.
  - Per-asset streams are isolated — a failing asset retries, then is logged and
    omitted instead of erroring the whole composite stream.
  - Platform clients (viem, Solana, Sui) are memoized instead of rebuilt on every
    read; the viem provider now batches contract reads via multicall.
  - Fixed watcher leaks and unhandled rejections in the EVM / Solana / Sui
    balance subscriptions.

## 2.1.0

### Minor Changes

- xc: fix node/esm imports

## 2.0.0

### Major Changes

- 8e7401c: Switch from wormhole mrl to wormhole direct integration with ntt

## 1.3.0

### Minor Changes

- 23af67e: Unidirectional routes & chain-native balance reads

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
