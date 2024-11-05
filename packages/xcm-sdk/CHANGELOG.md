# @galacticcouncil/xcm-sdk

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
