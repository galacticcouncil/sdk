# @galacticcouncil/sdk

## 4.0.2

### Patch Changes

- Return whitelist from router

## 4.0.1

### Patch Changes

- Asset whitelist flags

## 4.0.0

### Major Changes

- Upgrage pjs to 12.x

## 3.1.1

### Patch Changes

- Support bonds metadata

## 3.1.0

### Minor Changes

- Upgrade pjs to 11.2.1

## 3.0.1

### Patch Changes

- Fix system asset name

## 3.0.0

### Major Changes

- External asset internalId support (breaking change)
- FarmClient support

## 2.3.0

### Minor Changes

- Use calculateSpotPrice instead of getSpotPrice for XYK (precision fix)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/math-lbp@1.0.0
  - @galacticcouncil/math-omnipool@1.0.0
  - @galacticcouncil/math-stableswap@1.0.0
  - @galacticcouncil/math-xyk@1.0.0

## 2.2.3

### Patch Changes

- New cap difference calculation formula for Omnipool (fix)

## 2.2.2

### Patch Changes

- New cap difference calculation formula for Omnipool

## 2.2.1

### Patch Changes

- Fix assets getter

## 2.2.0

### Minor Changes

- Extends PoolService API with registry getters

## 2.1.0

### Minor Changes

- Omit low liquidity pools if calculating spot price

## 2.0.1

### Patch Changes

- Fix deferred wasm loading, export math

## 2.0.0

### Major Changes

- Use deferred wasms for ESM build
  - WHAT - Wasms are not longer embedded in esm bundle
  - WHY - To decrease resulting bundle size
  - FIX - Use corresponding wasm plugin in your build config

## 1.2.3

### Patch Changes

- Fix spot price dp

## 1.2.2

### Patch Changes

- Asset sufficiency flag

## 1.2.1

### Patch Changes

- External asset support

## 1.2.0

### Minor Changes

- External assets support

## 1.1.12

### Patch Changes

- Fix asset client (runtime dyn reg. upgrade)

## 1.1.11

### Patch Changes

- NPM Audit fix

## 1.1.10

### Patch Changes

- Increase number of supported hops to 5 to allow trading between 2 isolated pools that don't have asset in omnipool

## 1.1.9

### Patch Changes

- Price impact calculation fee exclusive

## 1.1.8

### Patch Changes

- Fix: Exclude XYK pools with invalid assets

## 1.1.7

### Patch Changes

- Fix fee assset payment (buy)

## 1.1.6

### Patch Changes

- Support dynamic registry (metadata fallback)

## 1.1.5

### Patch Changes

- Exclude maths from cjs build, sdk examples

## 1.1.4

### Patch Changes

- fix stableswap pool change sync

## 1.1.3

### Patch Changes

- fix lbp subs sync

## 1.1.2

### Patch Changes

- fix lbp pool active validation

## 1.1.1

### Patch Changes

- using map instead of array for graph

## 1.1.0

### Minor Changes

- Support asset locations

## 1.0.2

### Patch Changes

- fixed token balances

## 1.0.1

### Patch Changes

- support for polkadot 1.1
  automatically detecting pools

## 1.0.0

### Major Changes

- Pools perf. upgrade, types cleanup

## 0.7.7

### Patch Changes

- Check both sell/buy tradeability flags for pair, move route builder to pool utils

## 0.7.6

### Patch Changes

- Fix stableswap shared asset tradeability flags

## 0.7.5

### Patch Changes

- Fix: AssetClient metadata (duplicates fix)

## 0.7.4

### Patch Changes

- Fix AssetClient detail name

## 0.7.3

### Patch Changes

- Tradeable flags support for StableSwap & Omnipool

## 0.7.2

### Patch Changes

- Support meta for PoolAsset

## 0.7.1

### Patch Changes

- Sync share token

## 0.7.0

### Minor Changes

- Stableswap support

## 0.6.5

### Patch Changes

- Fix AssetClient, update lbp math

- Updated dependencies []:
  - @galacticcouncil/math-lbp@0.2.1

## 0.6.4

### Patch Changes

- Extend PoolAsset with origin

## 0.6.3

### Patch Changes

- Support for asset metadata bonds

## 0.6.2

### Patch Changes

- Lbp pool validity check, added assetType to AssetDetail

## 0.6.1

### Patch Changes

- Lbp pool validations, fix repay fee check

## 0.6.0

### Minor Changes

- Rebuild maths & sdk (workspace)

### Patch Changes

- Updated dependencies []:
  - @galacticcouncil/math-lbp@0.2.0
  - @galacticcouncil/math-omnipool@0.2.0
  - @galacticcouncil/math-xyk@0.2.0
