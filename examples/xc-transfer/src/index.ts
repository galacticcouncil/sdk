import { AssetAmount, ConfigBuilder } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';

import { sign } from './signers';
import { ctx } from './setup';
import { log } from './utils';

const { logAssets, logSrcChains, logDestChains } = log;
const { config, wallet } = ctx;

// Define transfer constraints
const srcChain = config.getChain('ethereum');
const destChain = config.getChain('hydration');
const asset = config.getAsset('eth');

const configBuilder = ConfigBuilder(config);
const { sourceChains } = configBuilder.assets().asset(asset);
const { destinationChains } = configBuilder
  .assets()
  .asset(asset)
  .source(srcChain);

// Dump transfer info
logAssets(srcChain);
logDestChains(asset.key, destinationChains);
logSrcChains(asset.key, sourceChains);

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

// Build transfer input data
const transfer = await TransferBuilder(wallet)
  .withAsset(asset)
  .withSource(srcChain)
  .withDestination(destChain)
  .build({ srcAddress: srcAddr, dstAddress: destAddr });

// Validate transfer
const status = await transfer.validate();

// Construct calldata with transfer amount
const transferAmount = '0.1';

const [call, fee] = await Promise.all([
  transfer.buildCall(transferAmount),
  transfer.estimateFee(transferAmount),
]);

// Dump transfer info
console.log(transfer);
console.log(status);
console.log('Estimated fee:', [fee.toDecimal(), fee.originSymbol].join(' '));
console.log(call);
console.log('Dry run:', await call.dryRun());

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();
