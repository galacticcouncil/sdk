# Galactic SDK

[![Build SDK](https://github.com/galacticcouncil/sdk/actions/workflows/main.yml/badge.svg)](https://github.com/galacticcouncil/sdk/actions/workflows/main.yml)
[![License](https://img.shields.io/github/license/galacticcouncil/sdk)](https://github.com/galacticcouncil/sdk/blob/master/LICENSE.md)

Collection of SDK(s) crafted to ease Hydration & Basilisk chains integration.

## Project Structure

[sdk_v]: https://img.shields.io/npm/v/@galacticcouncil/sdk.svg
[sdk_npm]: https://www.npmjs.com/package/@galacticcouncil/sdk
[sdk_log]: ./packages/sdk/CHANGELOG.md
[sdk]: ./packages/sdk

[xcm-core_v]: https://img.shields.io/npm/v/@galacticcouncil/xcm-core.svg
[xcm-core_npm]: https://www.npmjs.com/package/@galacticcouncil/xcm-core
[xcm-core_log]: ./packages/xcm-core/CHANGELOG.md
[xcm-core]: ./packages/xcm-core

[xcm-cfg_v]: https://img.shields.io/npm/v/@galacticcouncil/xcm-cfg.svg
[xcm-cfg_npm]: https://www.npmjs.com/package/@galacticcouncil/xcm-cfg
[xcm-cfg_log]: ./packages/xcm-cfg/CHANGELOG.md
[xcm-cfg]: ./packages/xcm-cfg

[xcm-sdk_v]: https://img.shields.io/npm/v/@galacticcouncil/xcm-sdk.svg
[xcm-sdk_npm]: https://www.npmjs.com/package/@galacticcouncil/xcm-sdk
[xcm-sdk_log]: ./packages/xcm-sdk/CHANGELOG.md
[xcm-sdk]: ./packages/xcm-sdk

[math-ema_v]: https://img.shields.io/npm/v/@galacticcouncil/math-ema.svg
[math-ema_npm]: https://www.npmjs.com/package/@galacticcouncil/math-ema
[math-ema_log]: ./packages/math-ema/CHANGELOG.md
[math-ema]: ./packages/math-ema

[math-hsm_v]: https://img.shields.io/npm/v/@galacticcouncil/math-hsm.svg
[math-hsm_npm]: https://www.npmjs.com/package/@galacticcouncil/math-hsm
[math-hsm_log]: ./packages/math-hsm/CHANGELOG.md
[math-hsm]: ./packages/math-hsm

[math-lbp_v]: https://img.shields.io/npm/v/@galacticcouncil/math-lbp.svg
[math-lbp_npm]: https://www.npmjs.com/package/@galacticcouncil/math-lbp
[math-lbp_log]: ./packages/math-lbp/CHANGELOG.md
[math-lbp]: ./packages/math-lbp

[math-lm_v]: https://img.shields.io/npm/v/@galacticcouncil/math-liquidity-mining.svg
[math-lm_npm]: https://www.npmjs.com/package/@galacticcouncil/math-liquidity-mining
[math-lm_log]: ./packages/math-liquidity-mining/CHANGELOG.md
[math-lm]: ./packages/math-liquidity-mining

[math-omni_v]: https://img.shields.io/npm/v/@galacticcouncil/math-omnipool.svg
[math-omni_npm]: https://www.npmjs.com/package/@galacticcouncil/math-omnipool
[math-omni_log]: ./packages/math-omnipool/CHANGELOG.md
[math-omni]: ./packages/math-omnipool

[math-stable_v]: https://img.shields.io/npm/v/@galacticcouncil/math-stableswap.svg
[math-stable_npm]: https://www.npmjs.com/package/@galacticcouncil/math-stableswap
[math-stable_log]: ./packages/math-stableswap/CHANGELOG.md
[math-stable]: ./packages/math-stableswap

[math-stake_v]: https://img.shields.io/npm/v/@galacticcouncil/math-staking.svg
[math-stake_npm]: https://www.npmjs.com/package/@galacticcouncil/math-staking
[math-stake_log]: ./packages/math-staking/CHANGELOG.md
[math-stake]: ./packages/math-staking

[math-xyk_v]: https://img.shields.io/npm/v/@galacticcouncil/math-xyk.svg
[math-xyk_npm]: https://www.npmjs.com/package/@galacticcouncil/math-xyk
[math-xyk_log]: ./packages/math-xyk/CHANGELOG.md
[math-xyk]: ./packages/math-xyk

| Package                                             | Version                             | Changelog                    | Description                     |
| :-------------------------------------------------- | :---------------------------------- | :--------------------------- | :------------------------------ |
| [`@galacticcouncil/sdk`][sdk]                       | [![sdk_v]][sdk_npm]                 | [changelog][sdk_log]         | Trade router & pool utilities   |
| [`@galacticcouncil/xcm-core`][xcm-core]             | [![xcm-core_v]][xcm-core_npm]       | [changelog][xcm-core_log]    | Cross-chain definitions & types |
| [`@galacticcouncil/xcm-cfg`][xcm-cfg]               | [![xcm-cfg_v]][xcm-cfg_npm]         | [changelog][xcm-cfg_log]     | Cross-chain route configs       |
| [`@galacticcouncil/xcm-sdk`][xcm-sdk]               | [![xcm-sdk_v]][xcm-sdk_npm]         | [changelog][xcm-sdk_log]     | Cross-chain transfer sdk        |
| [`@galacticcouncil/math-ema`][math-ema]             | [![math-ema_v]][math-ema_npm]       | [changelog][math-ema_log]    | EMA math                        |
| [`@galacticcouncil/math-hsm`][math-hsm]             | [![math-hsm_v]][math-hsm_npm]       | [changelog][math-hsm_log]    | HSM math                        |
| [`@galacticcouncil/math-lbp`][math-lbp]             | [![math-lbp_v]][math-lbp_npm]       | [changelog][math-lbp_log]    | LBP math                        |
| [`@galacticcouncil/math-liquidity-mining`][math-lm] | [![math-lm_v]][math-lm_npm]         | [changelog][math-lm_log]     | Liquidity mining math           |
| [`@galacticcouncil/math-omnipool`][math-omni]       | [![math-omni_v]][math-omni_npm]     | [changelog][math-omni_log]   | Omnipool math                   |
| [`@galacticcouncil/math-stableswap`][math-stable]   | [![math-stable_v]][math-stable_npm] | [changelog][math-stable_log] | Stableswap math                 |
| [`@galacticcouncil/math-staking`][math-stake]       | [![math-stake_v]][math-stake_npm]   | [changelog][math-stake_log]  | Staking math                    |
| [`@galacticcouncil/math-xyk`][math-xyk]             | [![math-xyk_v]][math-xyk_npm]       | [changelog][math-xyk_log]    | XYK math                        |

## Contributing

Everything about building, setting up development environment & releasing can be found in [CONTRIBUTING.md](CONTRIBUTING.md)

## Issue reporting

In case of unexpected sdk behaviour, please create well-written issue [here](https://github.com/galacticcouncil/sdk/issues/new). It makes it easier to find & fix the problem accordingly.

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
