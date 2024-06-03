# Galactic SDK

Collection of SDK(s) crafted to ease Basilisk & HydraDX chains integration.

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
                    :                     $$\   $$\                 $$\                    $$$$$$$\  $$\   $$\
                  !YJJ^                   $$ |  $$ |                $$ |                   $$  __$$\ $$ |  $$ |
                7B5. ~B5^                 $$ |  $$ |$$\   $$\  $$$$$$$ | $$$$$$\  $$$$$$\  $$ |  $$ |\$$\ $$  |
             .?B@G    ~@@P~               $$$$$$$$ |$$ |  $$ |$$  __$$ |$$  __$$\ \____$$\ $$ |  $$ | \$$$$  /
           :?#@@@Y    .&@@@P!.            $$  __$$ |$$ |  $$ |$$ /  $$ |$$ |  \__|$$$$$$$ |$$ |  $$ | $$  $$<
         ^?J^7P&@@!  .5@@#Y~!J!.          $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |     $$  __$$ |$$ |  $$ |$$  /\$$\
       ^JJ!.   :!J5^ ?5?^    ^?Y7.        $$ |  $$ |\$$$$$$$ |\$$$$$$$ |$$ |     \$$$$$$$ |$$$$$$$  |$$ /  $$ |
     ~PP: 7#B5!.         :?P#G: 7G?.      \__|  \__| \____$$ | \_______|\__|      \_______|\_______/ \__|  \__|
  .!P@G    7@@@#Y^    .!P@@@#.   ~@&J:              $$\   $$ |
  !&@@J    :&@@@@P.   !&@@@@5     #@@P.             \$$$$$$  |
   :J##:   Y@@&P!      :JB@@&~   ?@G!                \______/
     .?P!.?GY7:   .. .    ^?PP^:JP~
       .7Y7.  .!YGP^ ?BP?^   ^JJ^         This repository is part of https://github.com/galacticcouncil
         .!Y7Y#@@#:   ?@@@G?JJ^           Built with <3 for decentralisation.
            !G@@@Y    .&@@&J:
              ^5@#.   7@#?.               Copyright (C) 2021-2024  Intergalactic, Limited (GIB).
                :5P^.?G7.                 SPDX-License-Identifier: Apache-2.0
                  :?Y!                    Licensed under the Apache License, Version 2.0 (the "License");
                                          you may not use this file except in compliance with the License.
                                          http://www.apache.org/licenses/LICENSE-2.0
</pre>
For more details read [LICENSE.md](LICENSE.md)
