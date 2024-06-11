# Galactic SDK

Collection of SDK(s) crafted to ease Basilisk & Hydration chains integration.

## Project Structure

| Package               | Version             | Changelog              | Description            |
|:----------------------|:--------------------|:-----------------------|:-----------------------|
| [`@galacticcouncil/sdk`](./packages/sdk)                          | [![version](https://img.shields.io/npm/v/@galacticcouncil/sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/sdk)                | [changelog](./packages/sdk/CHANGELOG.md)  |  Trade router & pool utilities
| [`@galacticcouncil/xcm-core`](./packages/xcm-core)                | [![version](https://img.shields.io/npm/v/@galacticcouncil/xcm-core.svg)](https://www.npmjs.com/package/@galacticcouncil/xcm-core)      | [changelog](./packages/xcm-core/CHANGELOG.md)  |  Cross-chain definitions & types
| [`@galacticcouncil/xcm-cfg`](./packages/xcm-cfg)                  | [![version](https://img.shields.io/npm/v/@galacticcouncil/xcm-cfg.svg)](https://www.npmjs.com/package/@galacticcouncil/xcm-cfg)            | [changelog](./packages/xcm-cfg/CHANGELOG.md)  |  Cross-chain configuration
| [`@galacticcouncil/xcm-sdk`](./packages/xcm-sdk)                  | [![version](https://img.shields.io/npm/v/@galacticcouncil/xcm-sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/xcm-sdk)            | [changelog](./packages/xcm-sdk/CHANGELOG.md)  |  Cross-chain sdk
| [`@galacticcouncil/math-ema`](./packages/math-ema)                | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-ema.svg)](https://www.npmjs.com/package/@galacticcouncil/math-ema)           | [changelog](./packages/math-ema/CHANGELOG.md)  |  EMA math
| [`@galacticcouncil/math-lbp`](./packages/math-lbp)                | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-lbp.svg)](https://www.npmjs.com/package/@galacticcouncil/math-lbp)           | [changelog](./packages/math-lbp/CHANGELOG.md)  |  LBP math
| [`@galacticcouncil/math-liquidity-mining`](./packages/math-liquidity-mining)  | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-liquidity-mining.svg)](https://www.npmjs.com/package/@galacticcouncil/math-liquidity-mining)  | [changelog](./packages/math-liquidity-mining/CHANGELOG.md)  |  Liquidity mining math
| [`@galacticcouncil/math-omnipool`](./packages/math-omnipool)      | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-omnipool.svg)](https://www.npmjs.com/package/@galacticcouncil/math-omnipool)      | [changelog](./packages/math-omnipool/CHANGELOG.md)  |  Omnipool math
| [`@galacticcouncil/math-stableswap`](./packages/math-stableswap)  | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-stableswap.svg)](https://www.npmjs.com/package/@galacticcouncil/math-stableswap)    | [changelog](./packages/math-stableswap/CHANGELOG.md)  |  Stableswap math
| [`@galacticcouncil/math-staking`](./packages/math-staking)        | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-staking.svg)](https://www.npmjs.com/package/@galacticcouncil/math-staking)       | [changelog](./packages/math-staking/CHANGELOG.md)  |  Staking math
| [`@galacticcouncil/math-xyk`](./packages/math-xyk)                | [![version](https://img.shields.io/npm/v/@galacticcouncil/math-xyk.svg)](https://www.npmjs.com/package/@galacticcouncil/math-xyk)           | [changelog](./packages/math-xyk/CHANGELOG.md)  |  XYK math

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
