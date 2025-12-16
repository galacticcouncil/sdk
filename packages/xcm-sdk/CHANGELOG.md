# @galacticcouncil/xcm-sdk

## 10.10.0

### Minor Changes

[4626c650]: https://github.com/galacticcouncil/sdk/commit/4626c650
[5c9ed0af]: https://github.com/galacticcouncil/sdk/commit/5c9ed0af

- [[#4626c650][4626c650]] xcm: hyperbridge native fee est support, fix approval
- [[#5c9ed0af][5c9ed0af]] xcm: hyperbridge support

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.9.0

## 10.9.0

### Minor Changes

[96e72596]: https://github.com/galacticcouncil/sdk/commit/96e72596

- [[#96e72596][96e72596]] xcm: support lil jit

## 10.8.0

### Minor Changes

[d2d86b4c]: https://github.com/galacticcouncil/sdk/commit/d2d86b4c

- [[#d2d86b4c][d2d86b4c]] xcm: wh claim (jito sol)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.8.0

## 10.7.0

### Minor Changes

- Upgrade pjs to latest

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.6.0

## 10.6.0

### Minor Changes

[42e29743]: https://github.com/galacticcouncil/sdk/commit/42e29743
[eef0b7e2]: https://github.com/galacticcouncil/sdk/commit/eef0b7e2

- [[#42e29743][42e29743]] xcm: wallet remote xcm support
- [[#eef0b7e2][eef0b7e2]] wh: mrl redeem via xcm support

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.5.0

## 10.5.0

### Minor Changes

- xcm: fix deposit wh transfers api

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.4.0

## 10.4.0

### Minor Changes

- sui: support string (hex) chain id

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.3.0

## 10.3.0

### Minor Changes

- xcm: cleanup address space utils

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.2.0

## 10.2.0

### Minor Changes

[3949d8ab]: https://github.com/galacticcouncil/sdk/commit/3949d8ab
[a97f26a5]: https://github.com/galacticcouncil/sdk/commit/a97f26a5
[3d8b3ca0]: https://github.com/galacticcouncil/sdk/commit/3d8b3ca0

- [[#3949d8ab][3949d8ab]] sui: platform impl, adapter
- [[#a97f26a5][a97f26a5]] sui: build call & fee est
- [[#3d8b3ca0][3d8b3ca0]] sui: dry run support

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.1.0

## 10.1.2

### Patch Changes

- fix wormhole withdraws receiver based on payload type

## 10.1.1

### Patch Changes

- link operations to wh transfer

## 10.1.0

### Minor Changes

- wormhole transfer api

## 10.0.0

### Major Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@8.0.0

## 9.2.2

### Patch Changes

- Temp fix broken relay / hub dryRun2 / xcmPaymentApi

## 9.2.1

### Patch Changes

- Fix dryRun result xcm version upgrade (substrate)

## 9.2.0

### Minor Changes

- 9592191: Dry run call args (module/func)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@7.1.0

## 9.1.1

### Patch Changes

- Fix evm native transfer check

## 9.1.0

### Minor Changes

- Transfer builder utils

## 9.0.0

### Major Changes

- 781f8fb: SubstrateService messageId api
- 7c077e6: Support fee breakdown in ctx
- 32a6662: Wallet buildTransfer fluent api

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@7.0.0

## 8.6.0

### Minor Changes

- Support getQuote fallback price

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.6.0

## 8.5.0

### Minor Changes

- Dry run support (alpha)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.4.0

## 8.4.0

### Minor Changes

- 081e6ee: Rework XCM delivery fee est

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.3.0

## 8.3.0

### Minor Changes

- c4e8b70: Use finalized block hash when creating Solana v0 message

## 8.2.0

### Minor Changes

- Re-estimate fee if fee swap enabled with margin

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.2.0

## 8.1.1

### Patch Changes

- Fix mda account gen if dest relay
- Updated dependencies
  - @galacticcouncil/xcm-core@6.1.1

## 8.1.0

### Minor Changes

- Substrate signer fee opts support
- Swap re-work (fee swaps)
- Automatic delivery fee calculation (based on treasury acc)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.1.0

## 8.0.1

### Patch Changes

- Fix solana determine priority fee & budget calcs

## 8.0.0

### Major Changes

- Add solana platform support
- Support SwapResolver instead of DEX (removed)
- Transfer API refactoring (breaking!!!)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@6.0.0

## 7.0.1

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.5.0

## 7.0.0

### Patch Changes

- Updated dependencies
  - @galacticcouncil/sdk@5.0.0

## 6.3.3

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.4.0

## 6.3.2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.3.1
  - @galacticcouncil/sdk@4.6.0

## 6.3.1

### Patch Changes

- Updated dependencies
  - @galacticcouncil/sdk@4.5.1

## 6.3.0

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.3.0
  - @galacticcouncil/sdk@4.5.0

## 6.2.1

### Patch Changes

- Bump sdk to latest

## 6.2.0

### Minor Changes

- Support native bridge

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.2.0

## 6.1.0

### Minor Changes

- Unify transfer adapters
- Unify contract transfer value calc

## 6.0.0

### Major Changes

- New config/route changes, XTransfer v2

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@5.0.0

## 5.2.3

### Patch Changes

- Fix contract calldata validation

## 5.2.2

### Patch Changes

- Wallet props to default

## 5.2.1

### Patch Changes

- Fix calldata sender

## 5.2.0

### Minor Changes

- Pass opt fee to xTransfer validation

## 5.1.0

### Minor Changes

- Optional transfer data delta to validation fn

## 5.0.0

### Major Changes

- Support xchain swaps
- Support transfer validations

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@4.0.0

## 4.3.1

### Patch Changes

- Fix min amount calc

## 4.3.0

### Minor Changes

- Bump core deps (cjs support)

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@3.0.0

## 4.2.0

### Minor Changes

- Fix min transfer config calculation

## 4.1.0

### Minor Changes

- Upgrade to latest core

## 4.0.0

### Major Changes

- Upgrage pjs to 12.x

### Patch Changes

- Updated dependencies
  - @galacticcouncil/xcm-core@2.0.0

## 3.5.1

### Patch Changes

- Fix substrate decimals fallback for 0

## 3.5.0

### Minor Changes

- Upgrade xcm-core deps

## 3.4.0

### Minor Changes

- Upgrade core deps (viem upgrade)

## 3.3.0

### Minor Changes

- Upgrade core deps

## 3.2.0

### Minor Changes

- Wormhole scan & client

## 3.1.0

### Minor Changes

- Upgrade xcm-core deps

## 3.0.4

### Patch Changes

- Fix dst fee decimals (norm asset)

## 3.0.3

### Patch Changes

- Fix calculate min

## 3.0.2

### Patch Changes

- Include allowance info for erc20 approve xcall

## 3.0.1

### Patch Changes

- Export Erc20Client

## 3.0.0

### Major Changes

- Introducing MRL & Wormhole support

- Updated dependencies
  - @galacticcouncil/xcm-core@1.0.0

## 2.4.0

### Minor Changes

- Bundle size down (moonbeam deps as external)

## 2.3.1

### Patch Changes

- Dedup wallet balance subscribers

## 2.3.0

### Minor Changes

- Support XCM delivery fees

## 2.2.0

### Minor Changes

- Support usesChainDecimals, upgrade base moonbeams packages

## 2.1.0

### Minor Changes

- Upgrade of base moonbeams xcm packages

## 2.0.0

### Minor Changes

- substrate balance adapter rxjs read (fix race cond)
- fix moonbeam wss config

## 1.0.9

### Patch Changes

- fix ss58 validator

## 1.0.8

### Patch Changes

- evm reconciler, default resolvers

## 1.0.7

### Patch Changes

- wallet src fee balance support

## 1.0.6

### Patch Changes

- Move evm resolver to substrate service

## 1.0.5

### Patch Changes

- evm resolver fallback to 0n if invalid address

## 1.0.4

### Patch Changes

- Evm resolver support, fix transferMultiasset fee est

## 1.0.3

### Patch Changes

- Revert back inner hex

## 1.0.2

### Patch Changes

- Fix substrate calldata (use inner)

## 1.0.1

### Patch Changes

- Substrate apis conn singleton

## 1.0.0

- Initial xcm sdk release
