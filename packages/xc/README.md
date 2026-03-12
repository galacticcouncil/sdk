# Galactic XC

[![npm version](https://img.shields.io/npm/v/@galacticcouncil/xc.svg)](https://www.npmjs.com/package/@galacticcouncil/xc)

The easiest way to get started with cross-chain transfers. Provides a context factory that wires together `xc-sdk`, `xc-cfg`, and `xc-core`.

## Installation

Install with [npm](https://www.npmjs.com/):

`npm install @galacticcouncil/xc`

## Usage

Use `createXcContext` to quickly set up all components — config, wallet, and bridge integrations — in a single call.

```typescript
import { createXcContext } from '@galacticcouncil/xc';

const ctx = await createXcContext();
const { config, wallet } = ctx;
```

It handles all necessary setup under the hood. Just call the factory and you're ready to build transfers, subscribe balances, and more.

## Transfer

```typescript
// Define transfer
const srcChain = config.getChain('ethereum');
const destChain = config.getChain('hydration');
const asset = config.getAsset('eth');

const srcAddr = 'INSERT_ADDRESS';
const destAddr = 'INSERT_ADDRESS';

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
const fee = await transfer.estimateFee('1');
const call = await transfer.buildCall('1');

console.log(transfer);
console.log(status);
console.log(call);
```