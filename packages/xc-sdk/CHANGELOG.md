# @galacticcouncil/xc-sdk

## 2.4.0

### Minor Changes

- 4e62a17: feat(xc-sdk): multichain balances

### Patch Changes

- Updated dependencies [4e62a17]
  - @galacticcouncil/xc-core@2.4.0

## 2.3.1

### Patch Changes

- bdb7f55: Drop jitobundle from solana signer and fix base check

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

### Patch Changes

- Updated dependencies [c9684bd]
  - @galacticcouncil/xc-core@2.3.0

## 2.2.0

### Minor Changes

- 9e041f4: New `Wallet.getBalances(address, chain)` — one-shot snapshot of every
  asset configured on a chain, meant for balance lists / asset pickers that
  should fetch on demand instead of holding live subscriptions.

  `Wallet.subscribeBalance(address, chain, assets, observer)` now requires an
  explicit asset list, so live subscriptions stay narrowed to the assets in
  view — update call sites accordingly.

### Patch Changes

- Updated dependencies [9e041f4]
  - @galacticcouncil/xc-core@2.2.0

## 2.1.0

### Minor Changes

- xc: fix node/esm imports

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@2.1.0

## 2.0.0

### Major Changes

- 8e7401c: Switch from wormhole mrl to wormhole direct integration with ntt

### Patch Changes

- Updated dependencies [8e7401c]
  - @galacticcouncil/xc-core@2.0.0

## 1.3.0

### Minor Changes

- 23af67e: Unidirectional routes & chain-native balance reads

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
