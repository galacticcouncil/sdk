# @galacticcouncil/sdk-next

## 0.24.0

### Minor Changes

- update dca scheduler api - duration based

## 0.23.0

### Minor Changes

[12a0d3dd]: https://github.com/galacticcouncil/sdk/commit/12a0d3dd

- [[#12a0d3dd][12a0d3dd]] next: updated getWs function to return provider instead of client

## 0.22.0

### Minor Changes

- recalculate peg math upgrade (new updateAt ora arg support)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/math-stableswap@2.4.0

## 0.21.0

### Minor Changes

- rework peer deps

## 0.20.0

### Minor Changes

- bump common to 0.1.2

## 0.19.0

### Patch Changes

- Updated dependencies
  - @galacticcouncil/descriptors@1.7.0

## 0.18.1

### Patch Changes

- bump desc package

## 0.18.0

### Minor Changes

- 5070a89: Return staking points
- 65c1c84: Fix liquidity mining apr

## 0.17.0

### Minor Changes

- a8e8e01: Return invalid HF when totalDebt is 0

## 0.16.0

### Minor Changes

- dca: support no of orders in scheduler api

## 0.15.0

### Minor Changes

- b403e40: HF calculation adjustments

## 0.14.2

### Patch Changes

- fix papi again (downgrade to 0.19.x)

- Updated dependencies
  - @galacticcouncil/descriptors@1.5.1
  - @galacticcouncil/common@0.1.1

## 0.14.1

### Patch Changes

- fix: add next staking deps

## 0.14.0

### Minor Changes

[de485c9e]: https://github.com/galacticcouncil/sdk/commit/de485c9e
[0907b12f]: https://github.com/galacticcouncil/sdk/commit/0907b12f
[40e57599]: https://github.com/galacticcouncil/sdk/commit/40e57599

- [[#de485c9e][de485c9e]] next: rework current HF calculation
- [[#0907b12f][0907b12f]] next: configurable WsProvider
- [[#40e57599][40e57599]] next: common package utils

## 0.13.0

### Minor Changes

- 08a8a5d: Calculate health factor after swaping two aTokens

## 0.12.0

### Minor Changes

[014b377b]: https://github.com/galacticcouncil/sdk/commit/014b377b

- [[#014b377b][014b377b]] next: legacy provider, bump papi

## 0.11.0

### Minor Changes

[88b59157]: https://github.com/galacticcouncil/sdk/commit/88b59157
[3599e379]: https://github.com/galacticcouncil/sdk/commit/3599e379
[34bb004a]: https://github.com/galacticcouncil/sdk/commit/34bb004a
[3921d719]: https://github.com/galacticcouncil/sdk/commit/3921d719

- [[#88b59157][88b59157]] next: evm rpc adapter
- [[#3599e379][3599e379]] next: fix math 0 division
- [[#34bb004a][34bb004a]] next: bump papi & viem to latest
- [[#3921d719][3921d719]] next: extra gas dispatcher

### Patch Changes

- Updated dependencies
  - @galacticcouncil/descriptors@1.5.0

## 0.10.1

### Patch Changes

[deaf284b]: https://github.com/galacticcouncil/sdk/commit/deaf284b

- [[#deaf284b][deaf284b]] next: fix currencies api fetch (best block)

## 0.10.0

### Minor Changes

[204407d0]: https://github.com/galacticcouncil/sdk/commit/204407d0
[70b5b048]: https://github.com/galacticcouncil/sdk/commit/70b5b048
[436c7309]: https://github.com/galacticcouncil/sdk/commit/436c7309

- [[#204407d0][204407d0]] next: add hsm support
- [[#70b5b048][70b5b048]] Extend staking API
- [[#436c7309][436c7309]] Extend farm rewards

## 0.9.0

### Minor Changes

[56950a6c]: https://github.com/galacticcouncil/sdk/commit/56950a6c
[48c7ee9c]: https://github.com/galacticcouncil/sdk/commit/48c7ee9c

- [[#56950a6c][56950a6c]] next: remove pjs deps from staking
- [[#48c7ee9c][48c7ee9c]] next: extend staking API

## 0.8.0

### Minor Changes

[cabea4a8]: https://github.com/galacticcouncil/sdk/commit/cabea4a8
[c176078d]: https://github.com/galacticcouncil/sdk/commit/c176078d
[9729c005]: https://github.com/galacticcouncil/sdk/commit/9729c005
[d5c1eee6]: https://github.com/galacticcouncil/sdk/commit/d5c1eee6
[f2722395]: https://github.com/galacticcouncil/sdk/commit/f2722395
[048fd5ee]: https://github.com/galacticcouncil/sdk/commit/048fd5ee
[2c3abee8]: https://github.com/galacticcouncil/sdk/commit/2c3abee8
[23e4fbee]: https://github.com/galacticcouncil/sdk/commit/23e4fbee

- [[#cabea4a8][cabea4a8]] next: fix stableswap fees
- [[#c176078d][c176078d]] next: bump bfs to max 10
- [[#9729c005][9729c005]] next: fix aave updates
- [[#d5c1eee6][d5c1eee6]] next: update stable client
- [[#f2722395][f2722395]] next: rework pool fees
- [[#048fd5ee][048fd5ee]] next: move override to xyk
- [[#2c3abee8][2c3abee8]] next: omni 1.1.0 upgrade
- [[#23e4fbee][23e4fbee]] ext: rework pool state machine

## 0.7.1

### Patch Changes

- da47e8b: Add farm distributedRewards field

## 0.7.0

### Minor Changes

- 5b738de: Add farming rewards calculation

### Patch Changes

- 4dadb83: Fix farm apr and add getAllFarms functions
- ff240ca: Fix data from getAllFarms function

## 0.6.0

### Minor Changes

- eb1e3d2: Add stableswap pegs
- 34be9c6: Staking client
- 5b3d616: Balance client => Return full balance

### Patch Changes

- Updated dependencies [f183193]
- Updated dependencies [eb1e3d2]
  - @galacticcouncil/math-stableswap@2.3.0
  - @galacticcouncil/descriptors@1.4.0

## 0.5.0

### Minor Changes

- bump papi to latest (1.16.2)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/descriptors@1.3.0

## 0.4.1

### Patch Changes

- sdk: update twap api accessors

## 0.4.0

### Minor Changes

- WASM refactor: https://github.com/galacticcouncil/HydraDX-wasm/pull/40

### Patch Changes

- Updated dependencies
  - @galacticcouncil/math-liquidity-mining@1.2.0
  - @galacticcouncil/math-stableswap@2.2.0
  - @galacticcouncil/math-omnipool@1.3.0
  - @galacticcouncil/math-lbp@1.2.0
  - @galacticcouncil/math-xyk@1.2.0

## 0.3.0

### Minor Changes

[b1cb49da]: https://github.com/galacticcouncil/sdk/commit/b1cb49da

- [[#b1cb49da][b1cb49da]] sdk: min order budget public accessor

## 0.2.0

### Minor Changes

[87a6630]: https://github.com/galacticcouncil/sdk/commit/87a6630
[3c19e33]: https://github.com/galacticcouncil/sdk/commit/3c19e33

- [[#87a6630][87a6630]] next: add scheduling, refactor tx module
- [[#3c19e33][3c19e33]] next: add aave, evm, scheduler

### Patch Changes

- Updated dependencies
  - @galacticcouncil/descriptors@1.2.0

## 0.1.0

### Minor Changes

- Bump all maths to latest wasm-pack build

- Updated dependencies
  - @galacticcouncil/math-lbp@1.1.0
  - @galacticcouncil/math-liquidity-mining@1.1.0
  - @galacticcouncil/math-omnipool@1.2.0
  - @galacticcouncil/math-stableswap@2.1.0
  - @galacticcouncil/math-xyk@1.1.0

## 0.0.0

First beta release

### Patch Changes

- Updated dependencies
  - @galacticcouncil/descriptors@1.1.1
