# @galacticcouncil/sdk

## 9.2.0

### Minor Changes

[aaf6f862]: https://github.com/galacticcouncil/sdk/commit/aaf6f862
[b1cb49da]: https://github.com/galacticcouncil/sdk/commit/b1cb49da

- [[#aaf6f862][aaf6f862]] oracle: fallback to 0 if updated block negative
- [[#b1cb49da][b1cb49da]] sdk: min order budget public accessor

## 9.1.0

### Minor Changes

- Pass optional extra gas in transaction dto

## 9.0.1

### Patch Changes

- Fix tx eligible for sellAll

## 9.0.0

### Major Changes

[4c1f73f2]: https://github.com/galacticcouncil/sdk/commit/4c1f73f2
[8ab43456]: https://github.com/galacticcouncil/sdk/commit/8ab43456
[7ac95e0f]: https://github.com/galacticcouncil/sdk/commit/7ac95e0f
[3613c7b2]: https://github.com/galacticcouncil/sdk/commit/3613c7b2

- [[#4c1f73f2][4c1f73f2]] sdk: stableswap mm oracle support
- [[#8ab43456][8ab43456]] aave: fix sellAll calc
- [[#7ac95e0f][7ac95e0f]] sdk: evm share ws conn
- [[#3613c7b2][3613c7b2]] aave: fix liq index calc

## 8.1.1

### Patch Changes

- Allow passing opt assets to balance subscribe (revert)

## 8.1.0

### Minor Changes

⚠️ Important: TxUtils were dropped, use TxBuilderFactory

[6685efaa]: https://github.com/galacticcouncil/sdk/commit/6685efaa
[b8999637]: https://github.com/galacticcouncil/sdk/commit/b8999637
[2aa74490]: https://github.com/galacticcouncil/sdk/commit/2aa74490
[1f8d83ae]: https://github.com/galacticcouncil/sdk/commit/1f8d83ae
[7ffcfe8b]: https://github.com/galacticcouncil/sdk/commit/7ffcfe8b
[06123937]: https://github.com/galacticcouncil/sdk/commit/06123937

- [[#6685efaa][6685efaa]] sdk: fix aave max tx build
- [[#b8999637][b8999637]] sdk: tx module
- [[#2aa74490][2aa74490]] scheduler: sdk context support
- [[#1f8d83ae][1f8d83ae]] scheduler: sdk context factory
- [[#06123937][06123937]] scheduler: dca & twap init

## 8.0.1

### Patch Changes

- Drop wss://rpc.hydradx.cloud from rpc list

## 8.0.0

### Major Changes

⚠️ Important: In the 8.x release, we upgraded `@polkadot/api` to version **16.x**.

To ensure the router works as expected, **either**:

1. Use a custom `WsProvider` configuration with cache TTL at least 10 minutes
2. Use a custom `WsProvider` configuration with cache TTL disabled (null)

For more details visit [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 7.2.0

### Minor Changes

- Bump all maths to latest wasm-pack build

- Updated dependencies
  - @galacticcouncil/math-lbp@1.1.0
  - @galacticcouncil/math-liquidity-mining@1.1.0
  - @galacticcouncil/math-omnipool@1.2.0
  - @galacticcouncil/math-stableswap@2.1.0
  - @galacticcouncil/math-xyk@1.1.0

## 7.1.1

### Patch Changes

- Set omnipool dyn fee minimal block diff to 1

## 7.1.0

### Minor Changes

- Aave module support

## 7.0.3

### Patch Changes

- Fixed omnipool dynamic fees

## 7.0.2

### Patch Changes

- Generic Transaction & SubstrateTransaction def

## 7.0.1

### Patch Changes

- Fix export api module

## 7.0.0

### Major Changes

[b08ff34]: https://github.com/galacticcouncil/sdk/commit/b08ff34968ae4a804da3457791365537bb685d45
[e387a5d]: https://github.com/galacticcouncil/sdk/commit/e387a5d10ee7751c304066ab665a5c42013da932
[b83864c]: https://github.com/galacticcouncil/sdk/commit/b83864ccecd265c4acf42034daec80e0098eb4dd
[8aa1a4e]: https://github.com/galacticcouncil/sdk/commit/8aa1a4e76a673d7a08cbdd69430fe31eac3591b0
[cf57cc3]: https://github.com/galacticcouncil/sdk/commit/cf57cc37ca8c3e1bf29849337683dfbd261f16ab

- [[#b08ff34][b08ff34]] sdk: 7.x refactor & namespaces cleanup
- [[#e387a5d][e387a5d]] sdk: 7.x spec cleanup
- [[#b83864c][e387a5d]] sdk: h160 & erc20 utils
- [[#8aa1a4e][8aa1a4e]] sdk: evm client support
- [[#cf57cc3][cf57cc3]] sdk: buildWithdrawAndSellReserveTx support

## 6.2.0

### Minor Changes

- Transaction dryRun support
- PoolService buildSellAllTx support

## 6.1.4

### Patch Changes

- Fix most liquid route calc for aave
- Fix aave buy (flip)

## 6.1.3

### Patch Changes

- Fix aave wrap & unwrap pool validations

## 6.1.2

### Patch Changes

- Fix: Filter out virtual shares from most liquid route calc

## 6.1.1

### Patch Changes

- Update aave amm error messages
- Fix erc20 free balance calc

## 6.1.0

### Minor Changes

- e51f09d: Generic share asset routing support

## 6.0.0

### Major Changes

- [[#411](https://github.com/galacticcouncil/sdk/issues/143)] Drifting peg stableswap support
- [[#130](https://github.com/galacticcouncil/sdk/issues/145)] Aave trader AMM
- [[#130](https://github.com/galacticcouncil/sdk/issues/148)] Pool TLRU ctx cache

### Patch Changes

- Updated dependencies
  - @galacticcouncil/math-stableswap@2.0.0

## 5.6.1

### Patch Changes

- Fix APR api

## 5.6.0

### Minor Changes

- Expose most liquid route api

## 5.5.0

### Minor Changes

- 8e154fd: Upgrade stableswap math, rework omnipool dyn fees

## 5.4.0

### Minor Changes

- 6f46b18: Update stableswap spot price calculation (math)

## 5.3.0

### Minor Changes

- Decrease the bundle size (exterrnal deps unless esm)

## 5.2.0

### Minor Changes

- e7f7192: Update pool subs (non-blocking)

## 5.1.0

### Minor Changes

- Add Cap & ProtocolShare to Omnipool api

## 5.0.1

### Patch Changes

- Fix asset location in router api

## 5.0.0

### Major Changes

- Removing externalId & origin from Asset, using location instead (breaking change)

## 4.6.1

### Patch Changes

- Evict mem pools on registry sync

## 4.6.0

### Minor Changes

- Mem pools, perf upgrades

## 4.5.2

### Patch Changes

- Remove debug logs

## 4.5.1

### Patch Changes

- a17d1be: Fix balance subs perf issues

## 4.5.0

### Minor Changes

- Bump pjs to 14.x
- Call currencies api directly

## 4.4.0

### Minor Changes

- ea2c5e6: PoolClientV2 (currency api support)

## 4.3.0

### Minor Changes

- 0c3290f: Use CurrenciesApi in BalanceClient, support for ERC20 tokens

## 4.2.1

### Patch Changes

- Fix AssetClient: Support 0 decimals

## 4.2.0

### Minor Changes

- Support all registered assets (invalid)

## 4.1.0

### Minor Changes

- Min trade size ED validation

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
