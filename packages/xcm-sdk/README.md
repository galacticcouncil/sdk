# Galactic XCM SDK

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/xcm-sdk.svg)](https://www.npmjs.com/package/@galacticcouncil/xcm-sdk)

High-level wallet interface for cross-chain asset transfers. Supports Substrate, EVM, Sui, and Solana platforms, fee swaps, and Wormhole bridging.

Wallet does not perform any signing — it provides transfer data to maintain loose coupling & interoperability with 3rd party code.

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/xcm-sdk`

## API

```typescript
transfer(
    asset: string | Asset,
    srcAddr: string,
    srcChain: string | AnyChain,
    dstAddr: string,
    dstChain: string | AnyChain
  ): Promise<Transfer>
subscribeBalance(
    address: string,
    chain: string | AnyChain,
    observer: (balances: AssetAmount[]) => void
  )
```

## Usage

```typescript
// Import
import {
  assetsMap,
  chainsMap,
  routesMap,
  dex,
  validations,
} from '@galacticcouncil/xcm-cfg';
import { ConfigService, EvmParachain } from '@galacticcouncil/xcm-core';
import { Wallet, Call } from '@galacticcouncil/xcm-sdk';

// Initialize config service
const configService = new ConfigService({
  assets: assetsMap,
  chains: chainsMap,
  routes: routesMap,
});

// Initialize wallet
const wallet = new Wallet({
  configService: configService,
  transferValidations: validations,
});

// Register dex-es
const hydration = configService.getChain('hydration');
const assethub = configService.getChain('assethub');

wallet.registerDex(
  new dex.HydrationDex(hydration),
  new dex.AssethubDex(assethub)
);

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
const transfer = await wallet.transfer(
  asset,
  srcAddr,
  srcChain,
  destAddr,
  destChain
);

// Validate transfer
const status = await transfer.validate();

// Estimate fee & construct calldata with transfer amount (1 ETH)
const fee: AssetAmount = await transfer.estimateFee('1');
const feeInfo = [
  'Estimated fee:',
  fee.toDecimal(fee.decimals),
  fee.originSymbol,
].join(' ');
const call: Call = await transfer.buildCall('1');

// Dump transfer info
console.log(transfer);
console.log(status);
console.log(feeInfo);
console.log(call);

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();
```
