# @galacticcouncil/xc-swap

## 0.8.0

### Minor Changes

- xc: migrate swap to the current intent form

  The emitter moved from the Moonbeam token-bridge rail to a direct NTT
  settlement, which reshapes the entry point and the fee model:
  - `swapAndBridge` is replaced by `placeOrder`
  - The GLMR xcm fee is gone — the rail's cost is charged against the swap
    output instead of bought from the input
  - `intentId` is dropped; an order is tracked by its deposit address, and by
    the settlement sequence once the transaction lands
  - Settlements are quantized to the rail's precision
  - Estimates now flag a paused or rate-limited rail before it reverts on-chain

  Breaking: `XcSwapOpts.xcmFee` and `XcSwapRequest.intentId` are removed.

## 0.7.0

### Minor Changes

- bump to sdk 2.x peer

## 0.6.0

### Minor Changes

- bump xc swap + factory

## 0.5.0

### Minor Changes

- bump xc deps

## 0.4.0

### Minor Changes

- xcswap: add abis, validations

## 0.3.0

### Minor Changes

- xc: referrer, bump xcm fee

## 0.2.0

### Minor Changes

- xc: swap, parallel quote exec, fee rework

## 0.1.0

### Minor Changes

- init version
- 43025d4: Add `xc-swap` — cross-chain swap SDK for Hydration → NIR
