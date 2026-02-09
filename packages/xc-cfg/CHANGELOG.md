# @galacticcouncil/xc-cfg

## 0.12.1

### Patch Changes

[c12bc0d4]: https://github.com/galacticcouncil/sdk/commit/c12bc0d4

- [[#c12bc0d4][c12bc0d4]] xc: fix erc20 snowbridge transfers 

## 0.12.0

### Minor Changes

[ff0cdd58]: https://github.com/galacticcouncil/sdk/commit/ff0cdd58
[fca6bf5b]: https://github.com/galacticcouncil/sdk/commit/fca6bf5b

- [[#ff0cdd58][ff0cdd58]] xc: use xTokens for interlay transfers
- [[#fca6bf5b][fca6bf5b]] xc: update fees and transfer types

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.11.0

## 0.11.1

### Patch Changes

[162300b1]: https://github.com/galacticcouncil/sdk/commit/162300b1

- [[#162300b1][162300b1]] xc: added kusama xcmDeliveryFee

## 0.11.0

### Minor Changes

[f2b52124]: https://github.com/galacticcouncil/sdk/commit/f2b52124
[9424cbdd]: https://github.com/galacticcouncil/sdk/commit/9424cbdd

- [[#f2b52124][f2b52124]] xc: moved rentReserve to feeCalc
- [[#9424cbdd][9424cbdd]] xc: fix calculateMax function for solana (rentReserve fee)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.10.0

## 0.10.0

### Minor Changes

[9e325697]: https://github.com/galacticcouncil/sdk/commit/9e325697

- [[#9e325697][9e325697]] xc: cleanup shitcoins

## 0.9.0

### Minor Changes

[19d18f02]: https://github.com/galacticcouncil/sdk/commit/19d18f02
[361cee42]: https://github.com/galacticcouncil/sdk/commit/361cee42
[0a0a6783]: https://github.com/galacticcouncil/sdk/commit/0a0a6783

- [[#19d18f02][19d18f02]] xc: removing teer, tnkr and xrt
- [[#361cee42][361cee42]] xc: removed pha, cfg, nodl, sub tokens
- [[#0a0a6783][0a0a6783]] xc: removed acala, zeitgeist, kilt, centrifuge, darwinia

## 0.8.0

### Minor Changes

[1aa7675e]: https://github.com/galacticcouncil/sdk/commit/1aa7675e
[87a9f5a4]: https://github.com/galacticcouncil/sdk/commit/87a9f5a4
[c12bb7eb]: https://github.com/galacticcouncil/sdk/commit/c12bb7eb
[408a4193]: https://github.com/galacticcouncil/sdk/commit/408a4193

- [[#1aa7675e][1aa7675e]] xc: cfg reserve validator fix
- [[#87a9f5a4][87a9f5a4]] xc: fix pendulum, ewt and crust transfers
- [[#c12bb7eb][c12bb7eb]] xc: remove acala chain routes
- [[#408a4193][408a4193]] xc: fixed reserve asset configs, hardcoded fees

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.9.0

## 0.7.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.8.0

## 0.7.1

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.7.0

## 0.7.0

### Minor Changes

[01ebee31]: https://github.com/galacticcouncil/sdk/commit/01ebee31
[295aa7bb]: https://github.com/galacticcouncil/sdk/commit/295aa7bb

- [[#01ebee31][01ebee31]] xc: removing xtokens from moonbeam
- [[#295aa7bb][295aa7bb]] xc: PolkadotXCM moonbeam implementation

## 0.6.2

### Patch Changes

[06a3fd41]: https://github.com/galacticcouncil/sdk/commit/06a3fd41

- [[#06a3fd41][06a3fd41]] xc: fix snowbridge transfers

## 0.6.1

### Patch Changes

[e0f9309f]: https://github.com/galacticcouncil/sdk/commit/e0f9309f

- [[#e0f9309f][e0f9309f]] xc: fix value.asBytes is not a function

## 0.6.0

### Minor Changes

[d93e32ec]: https://github.com/galacticcouncil/sdk/commit/d93e32ec
[b7b675ce]: https://github.com/galacticcouncil/sdk/commit/b7b675ce
[d814a241]: https://github.com/galacticcouncil/sdk/commit/d814a241

- [[#d93e32ec][d93e32ec]] xc: making buffer consistent to 20%
- [[#b7b675ce][b7b675ce]] xc: added reserve chain validation
- [[#b7b675ce][b7b675ce]] xc: removing hardcoded fees and added fee calculation builder

## 0.5.0

### Minor Changes

[058a87a2]: https://github.com/galacticcouncil/sdk/commit/058a87a2
[7b3ca32a]: https://github.com/galacticcouncil/sdk/commit/7b3ca32a
[2087a88e]: https://github.com/galacticcouncil/sdk/commit/2087a88e
[d9f2fea5]: https://github.com/galacticcouncil/sdk/commit/d9f2fea5
[b6a9f031]: https://github.com/galacticcouncil/sdk/commit/b6a9f031

- [[#058a87a2][058a87a2]] xc: added assets.length argument to toDepositXcmOnDest
- [[#7b3ca32a][7b3ca32a]] xc: fixed mrl transfers
- [[#2087a88e][2087a88e]] xc: removed acala wrapped assets weth, wbtc and dai
- [[#d9f2fea5][d9f2fea5]] xc: kusama chains xtokens removal
- [[#b6a9f031][b6a9f031]] xc: changed xTokens routes to PolkadotXCM

## 0.4.4

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.6.0

## 0.4.3

### Patch Changes

- fix assethub dwellir rpcs

## 0.4.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.5.0

## 0.4.1

### Patch Changes

- fix assets.asset balances

## 0.4.0

### Minor Changes

- rework peer deps

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xc-core@0.4.0

## 0.3.0

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
