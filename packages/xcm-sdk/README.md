# Galactic XCM SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/xcm-sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/xcm-sdk)

Wallet interface for cross-chain interactions in the Polkadot/Kusama ecosystem.

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/xcm-sdk`

## Wallet

Unified interface for asset multi-platform transfer supporting fee swaps & bridging. Wallet does not perform any signing
rather provide transfer data to maintain loose coupling & interoperability with 3rd party code.

### API

```typescript
transfer(
    asset: string | Asset,
    srcAddr: string,
    srcChain: string | AnyChain,
    dstAddr: string,
    dstChain: string | AnyChain
  ): Promise<XTransfer>
subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  )
```

### Usage

```typescript
// Import
import { PoolService } from '@galacticcouncil/sdk';
import {
  assetsMap,
  chainsMap,
  routesMap,
  validations,
  HydrationConfigService,
} from '@galacticcouncil/xcm-cfg';
import { EvmParachain } from '@galacticcouncil/xcm-core';
import { Wallet } from '@galacticcouncil/xcm-sdk';

// Initialize hydration API
const hydration = configService.getChain('hydration') as EvmParachain;
const hydrationApi = await hydration.api;

// Initialize pool service (DEX)
const poolService = new PoolService(hydrationApi);

// Initialize config service
const configService = new HydrationConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Initialize wallet
const wallet = new Wallet({
  configService: configService,
  poolService: poolService,
  transferValidations: validations,
});

// Define transfer
const srcChain = configService.getChain('ethereum');
const destChain = configService.getChain('hydration');
const asset = configService.getAsset('eth');

// Define source & dest accounts
const srcAddr = 'INSERT_ADDRESS';
const destAddr = 'INSERT_ADDRESS';

// Subscribe source chain token balance
const balanceObserver = (balances: AssetAmount[]) => console.log(balances);
const balanceSubscription = await wallet.subscribeBalance(
  srcAddr,
  srcChain,
  balanceObserver
);

// Get transfer data
const xTransfer = await wallet.transfer(
  asset,
  srcAddr,
  srcChain,
  destAddr,
  destChain
);

// Validate transfer
const status = await xTransfer.validate();

// Estimate fee & construct calldata with transfer amount (1 ETH)
const fee: AssetAmount = await xTransfer.estimateFee('1');
const feeInfo = [
  'Estimated fee:',
  fee.toDecimal(fee.decimals),
  fee.originSymbol,
].join(' ');
const call: XCall = await xTransfer.buildCall('1');

// Dump transfer info
console.log(xTransfer);
console.log(status);
console.log(feeInfo);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();
```
