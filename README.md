# Galactic SDK

[![Build SDK](https://github.com/galacticcouncil/sdk/actions/workflows/main.yml/badge.svg)](https://github.com/galacticcouncil/sdk/actions/workflows/main.yml)
[![License](https://img.shields.io/github/license/galacticcouncil/sdk)](https://github.com/galacticcouncil/sdk/blob/master/LICENSE.md)

Collection of SDK(s) crafted to ease [Hydration](https://hydration.net) chain integration. This monorepo contains everything you need to build on Hydration — from low-level pool math to high-level trading SDKs and cross-chain transfer tooling.

**Note:** The previous `@polkadot/api`-based toolkit (`sdk`, `xcm-core`, `xcm-cfg`, `xcm-sdk`) has been moved to [galacticcouncil/sdk-legacy](https://github.com/galacticcouncil/sdk-legacy).

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [General](#general) — common, descriptors, sdk-next
- [XC (Cross-Chain)](#xc-cross-chain) — xc, xc-core, xc-cfg, xc-sdk, xc-scan
- [Math](#math) — WASM pool math modules
- [Examples](#examples)
- [Contributing](#contributing)

## Overview

```
┌────────────────────────────────────────────────────────────┐
│                         Your dApp                          │
├────────────────────────────────┬───────────────────────────┤
│         « sdk-next »           │         « xc »            │
│         ··············         │         ·······           │
│         Trade routing          │         Cross-chain       │
│         Pool queries           │         Transfers         │
│               │                │                           │
│          ┌────┴──────┐         │                           │
│          │  math-*   │         │                           │
│          │ Pool math │         │                           │
│          │ (WASM)    │         │                           │
│          └───────────┘         │                           │
├───────────────────┬────────────┴───────────────────────────┤
│  « common »       │  « descriptors »                       │
│  ···········      │  ················                      │
│  Shared utils     │  Chain metadata                        │
├───────────────────┴────────────────────────────────────────┤
│                      polkadot-api                          │
│                    Substrate SDK                           │
└────────────────────────────────────────────────────────────┘
```

All packages are built on the modern [Polkadot API (papi)](https://papi.how/).

## Getting Started

### Prerequisites

- Node.js 23+
- npm 10+

### Installation

Pick the packages you need:

```bash
# Trading SDK
npm i @galacticcouncil/sdk-next

# Cross-chain transfers
npm i @galacticcouncil/xc
```


## General

Core packages providing shared utilities, chain metadata, and trading functionality.

<!-- link refs: general -->
[sdk-next_v]: https://img.shields.io/npm/v/@galacticcouncil/sdk-next.svg
[sdk-next_npm]: https://www.npmjs.com/package/@galacticcouncil/sdk-next
[sdk-next_log]: ./packages/sdk-next/CHANGELOG.md

[common_v]: https://img.shields.io/npm/v/@galacticcouncil/common.svg
[common_npm]: https://www.npmjs.com/package/@galacticcouncil/common
[common_log]: ./packages/common/CHANGELOG.md

[descriptors_v]: https://img.shields.io/npm/v/@galacticcouncil/descriptors.svg
[descriptors_npm]: https://www.npmjs.com/package/@galacticcouncil/descriptors
[descriptors_log]: ./packages/descriptors/CHANGELOG.md

| Package | Version | Changelog | Description |
|:---|:---|:---|:---|
| [`@galacticcouncil/common`](./packages/common) | [![common_v]][common_npm] | [changelog][common_log] | Shared utilities (helpers, evm, xcm) |
| [`@galacticcouncil/descriptors`](./packages/descriptors) | [![descriptors_v]][descriptors_npm] | [changelog][descriptors_log] | Hydration papi type-safe metadata descriptors |
| [`@galacticcouncil/sdk-next`](./packages/sdk-next) | [![sdk-next_v]][sdk-next_npm] | [changelog][sdk-next_log] | Trade router & pool utilities (`polkadot-api`) |


## XC (Cross-Chain)

Cross-chain transfer toolkit built on `polkadot-api`. Modular architecture with clean separation between core types, configuration, and wallet interface.

<!-- link refs: xc -->
[xc_v]: https://img.shields.io/npm/v/@galacticcouncil/xc.svg
[xc_npm]: https://www.npmjs.com/package/@galacticcouncil/xc
[xc_log]: ./packages/xc/CHANGELOG.md

[xc-core_v]: https://img.shields.io/npm/v/@galacticcouncil/xc-core.svg
[xc-core_npm]: https://www.npmjs.com/package/@galacticcouncil/xc-core
[xc-core_log]: ./packages/xc-core/CHANGELOG.md

[xc-cfg_v]: https://img.shields.io/npm/v/@galacticcouncil/xc-cfg.svg
[xc-cfg_npm]: https://www.npmjs.com/package/@galacticcouncil/xc-cfg
[xc-cfg_log]: ./packages/xc-cfg/CHANGELOG.md

[xc-sdk_v]: https://img.shields.io/npm/v/@galacticcouncil/xc-sdk.svg
[xc-sdk_npm]: https://www.npmjs.com/package/@galacticcouncil/xc-sdk
[xc-sdk_log]: ./packages/xc-sdk/CHANGELOG.md

[xc-scan_v]: https://img.shields.io/npm/v/@galacticcouncil/xc-scan.svg
[xc-scan_npm]: https://www.npmjs.com/package/@galacticcouncil/xc-scan
[xc-scan_log]: ./packages/xc-scan/CHANGELOG.md

| Package | Version | Changelog | Description |
|:---|:---|:---|:---|
| [`@galacticcouncil/xc`](./packages/xc) | [![xc_v]][xc_npm] | [changelog][xc_log] | High-level context factory (batteries-included) |
| [`@galacticcouncil/xc-core`](./packages/xc-core) | [![xc-core_v]][xc-core_npm] | [changelog][xc-core_log] | Core types, asset & chain definitions |
| [`@galacticcouncil/xc-cfg`](./packages/xc-cfg) | [![xc-cfg_v]][xc-cfg_npm] | [changelog][xc-cfg_log] | Pre-built route configs & DEX integrations |
| [`@galacticcouncil/xc-sdk`](./packages/xc-sdk) | [![xc-sdk_v]][xc-sdk_npm] | [changelog][xc-sdk_log] | Wallet interface for multi-platform transfers |
| [`@galacticcouncil/xc-scan`](./packages/xc-scan) | [![xc-scan_v]][xc-scan_npm] | [changelog][xc-scan_log] | Cross-chain transaction scanning |

### Architecture

```
@galacticcouncil/xc          <- Start here (context factory, DEX factory)
├── @galacticcouncil/xc-sdk  <- Wallet, transfers, fee swaps
├── @galacticcouncil/xc-cfg  <- Route configs, DEX implementations
└── @galacticcouncil/xc-core <- Core types, chain & asset definitions
```


## Math

WebAssembly math modules compiled from Rust. Each module provides high-performance, deterministic calculations for a specific Hydration pool type. These are standalone packages with zero JS dependencies.

<!-- link refs: math -->
[math-ema_v]: https://img.shields.io/npm/v/@galacticcouncil/math-ema.svg
[math-ema_npm]: https://www.npmjs.com/package/@galacticcouncil/math-ema
[math-ema_log]: ./packages/math-ema/CHANGELOG.md

[math-hsm_v]: https://img.shields.io/npm/v/@galacticcouncil/math-hsm.svg
[math-hsm_npm]: https://www.npmjs.com/package/@galacticcouncil/math-hsm
[math-hsm_log]: ./packages/math-hsm/CHANGELOG.md

[math-lbp_v]: https://img.shields.io/npm/v/@galacticcouncil/math-lbp.svg
[math-lbp_npm]: https://www.npmjs.com/package/@galacticcouncil/math-lbp
[math-lbp_log]: ./packages/math-lbp/CHANGELOG.md

[math-lm_v]: https://img.shields.io/npm/v/@galacticcouncil/math-liquidity-mining.svg
[math-lm_npm]: https://www.npmjs.com/package/@galacticcouncil/math-liquidity-mining
[math-lm_log]: ./packages/math-liquidity-mining/CHANGELOG.md

[math-omni_v]: https://img.shields.io/npm/v/@galacticcouncil/math-omnipool.svg
[math-omni_npm]: https://www.npmjs.com/package/@galacticcouncil/math-omnipool
[math-omni_log]: ./packages/math-omnipool/CHANGELOG.md

[math-stable_v]: https://img.shields.io/npm/v/@galacticcouncil/math-stableswap.svg
[math-stable_npm]: https://www.npmjs.com/package/@galacticcouncil/math-stableswap
[math-stable_log]: ./packages/math-stableswap/CHANGELOG.md

[math-stake_v]: https://img.shields.io/npm/v/@galacticcouncil/math-staking.svg
[math-stake_npm]: https://www.npmjs.com/package/@galacticcouncil/math-staking
[math-stake_log]: ./packages/math-staking/CHANGELOG.md

[math-xyk_v]: https://img.shields.io/npm/v/@galacticcouncil/math-xyk.svg
[math-xyk_npm]: https://www.npmjs.com/package/@galacticcouncil/math-xyk
[math-xyk_log]: ./packages/math-xyk/CHANGELOG.md

| Package | Version | Changelog | Pool Type |
|:---|:---|:---|:---|
| [`@galacticcouncil/math-omnipool`](./packages/math-omnipool) | [![math-omni_v]][math-omni_npm] | [changelog][math-omni_log] | Omnipool — single-sided unified liquidity |
| [`@galacticcouncil/math-stableswap`](./packages/math-stableswap) | [![math-stable_v]][math-stable_npm] | [changelog][math-stable_log] | Stableswap — low-slippage stable asset trading |
| [`@galacticcouncil/math-xyk`](./packages/math-xyk) | [![math-xyk_v]][math-xyk_npm] | [changelog][math-xyk_log] | XYK — constant product AMM |
| [`@galacticcouncil/math-lbp`](./packages/math-lbp) | [![math-lbp_v]][math-lbp_npm] | [changelog][math-lbp_log] | LBP — liquidity bootstrapping pool |
| [`@galacticcouncil/math-hsm`](./packages/math-hsm) | [![math-hsm_v]][math-hsm_npm] | [changelog][math-hsm_log] | HSM — isolated multi-pool |
| [`@galacticcouncil/math-ema`](./packages/math-ema) | [![math-ema_v]][math-ema_npm] | [changelog][math-ema_log] | EMA — exponential moving average oracle |
| [`@galacticcouncil/math-staking`](./packages/math-staking) | [![math-stake_v]][math-stake_npm] | [changelog][math-stake_log] | Staking reward calculations |
| [`@galacticcouncil/math-liquidity-mining`](./packages/math-liquidity-mining) | [![math-lm_v]][math-lm_npm] | [changelog][math-lm_log] | Liquidity mining reward calculations |

> **Note:** You typically don't need to install math packages directly — they are dependencies of `sdk-next`.


## Examples

Ready-to-run examples are available in the [`examples/`](./examples) directory:

| Example | Description |
|:---|:---|
| [`sdk-next-cjs`](./examples/sdk-next-cjs) | SDK-Next usage with CommonJS |
| [`sdk-next-esm`](./examples/sdk-next-esm) | SDK-Next usage with ES Modules |
| [`xc-transfer`](./examples/xc-transfer) | XC cross-chain transfer |


## Contributing

Everything about building, setting up development environment & releasing can be found in [CONTRIBUTING.md](CONTRIBUTING.md).

## Issue Reporting

In case of unexpected SDK behaviour, please create a well-written issue [here](https://github.com/galacticcouncil/sdk/issues/new). It makes it easier to find & fix the problem accordingly.

## Legal

<pre>
This file is part of https://github.com/galacticcouncil/*

               $$$$$$$      Licensed under the Apache License, Version 2.0 (the "License")
            $$$$$$$$$$$$$        you may only use this file in compliance with the License
         $$$$$$$$$$$$$$$$$$$
                     $$$$$$$$$       Copyright (C) 2021-2024  Intergalactic, Limited (GIB)
        $$$$$$$$$$$   $$$$$$$$$$                       SPDX-License-Identifier: Apache-2.0
     $$$$$$$$$$$$$$$$$$$$$$$$$$
  $$$$$$$$$$$$$$$$$$$$$$$        $                      Built with <3 for decentralisation
 $$$$$$$$$$$$$$$$$$$        $$$$$$$
 $$$$$$$         $$$$$$$$$$$$$$$$$$      Unless required by applicable law or agreed to in
  $       $$$$$$$$$$$$$$$$$$$$$$$       writing, software distributed under the License is
     $$$$$$$$$$$$$$$$$$$$$$$$$$        distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
     $$$$$$$$$   $$$$$$$$$$$         OR CONDITIONS OF ANY KIND, either express or implied.
       $$$$$$$$
         $$$$$$$$$$$$$$$$$$            See the License for the specific language governing
            $$$$$$$$$$$$$                   permissions and limitations under the License.
               $$$$$$$
                                                                $$
 $$$$$   $$$$$                    $$                      $$
  $$$     $$$  $$$     $$   $$$$$ $$  $$$ $$$$  $$$$$$$  $$$$  $$$    $$$$$$   $$ $$$$$$
  $$$     $$$   $$$   $$  $$$    $$$   $$$  $  $$     $$  $$    $$  $$     $$$  $$$   $$$
  $$$$$$$$$$$    $$  $$   $$$     $$   $$        $$$$$$$  $$    $$  $$     $$$  $$     $$
  $$$     $$$     $$$$    $$$     $$   $$     $$$     $$  $$    $$  $$$     $$  $$     $$
 $$$$$   $$$$$     $$      $$$   $$$   $$     $$$$   $$$  $$    $$   $$$   $$   $$    $$$
                  $$         $$$$$               $$$$$     $$          $$$$
                $$$
</pre>

For more details read [LICENSE.md](LICENSE.md)
