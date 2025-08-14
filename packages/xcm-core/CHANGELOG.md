# @galacticcouncil/xcm-core

## 8.1.0

### Minor Changes

[44309f9f]: https://github.com/galacticcouncil/sdk/commit/44309f9f

- [[#44309f9f][44309f9f]] sui: core definitions & types

## 8.0.0

### Major Changes

- Upgrade pjs to 16.x
- Update SubstrateApis socket init config

### Patch Changes

- 09497fe: Support esm server side
- 92b3b99: Rollback V5 augment fix

## 7.1.0

### Minor Changes

- 92b3b99: Fallback V5 -> V4 (fix augment)

## 7.0.0

### Major Changes

- 7c077e6: Fee breakdown & messageId ctx support
- 6700565: ConfigBuilder: Support multiple asset routes

## 6.6.0

### Minor Changes

- Support getQuote fallback price
- Disable rank ping in EvmClient

## 6.5.0

### Minor Changes

- Support opt metadata in SubstrateApis
- 0d5426a: Support api metadata

## 6.4.0

### Minor Changes

- Update ABI's
- EvmClient fallback ranking alg

## 6.3.0

### Minor Changes

- 14d9147: Sync ecosystem & consensus names

## 6.2.0

### Minor Changes

- AssetAmount increase by percentage helper

## 6.1.1

### Patch Changes

- Fix mda account gen if dest relay

## 6.1.0

### Minor Changes

- Dex re-work
- Chain currency asset
- Parachain flags:
  - treasury
  - cex forwarding
  - delivery fee

## 6.0.0

### Major Changes

- Add solana platform support
- Repackage bridges
- Chain swap support
- Chain currency support

## 5.5.0

### Minor Changes

- Remove getPalletInstance from Parachain def (present in xcmLocation if any)

## 5.4.0

### Minor Changes

- c879417: Support route tags

## 5.3.1

### Patch Changes

- a2303e6: Downgrade pjs to 14.0.x
- 1f2929f: Downgrade pjs to 14.0.x

## 5.3.0

### Minor Changes

- Bump pjs to 14.x
- Support EvmChain rpcs fallback

## 5.2.0

### Minor Changes

- Multilocation utils

## 5.1.0

### Minor Changes

- Asset xcm locations support
- Link abi with contract config
- Increase SubstrateApis cache to 40 conn

## 5.0.0

### Major Changes

- New config/route definition, context upgrade

## 4.0.1

### Patch Changes

- Export missing chain types

## 4.0.0

### Major Changes

- Support xchain swaps
- Support transfer validations

## 3.0.0

### Major Changes

- Switch to lru-cache instead of @thi.ng/cache. Dropped cjs support as of 2.0.0

## 2.2.0

### Minor Changes

- Support Parachain explorer

## 2.1.1

### Patch Changes

- Fix EvmParachain constructor

## 2.1.0

### Minor Changes

- Support EVM address space flag for Parachain

## 2.0.0

### Major Changes

- Upgrage pjs to 12.x

## 1.7.0

### Minor Changes

- Upgrade pjs to 11.2.1

## 1.6.0

### Minor Changes

- Config service immutable configs, chain asset setter, viem upgrade

## 1.5.0

### Minor Changes

- SubstrateApis retry opts support

## 1.4.0

### Minor Changes

- Fix ABI type inference

## 1.3.0

### Minor Changes

- Wormhole chain guard, utils cleanup, dedup abis

## 1.2.0

### Minor Changes

- Support multiple wss in chain config

## 1.1.0

### Minor Changes

- Multiple RPC's support

## 1.0.0

### Major Changes

- Introducing MRL & Wormhole support (initial version)
