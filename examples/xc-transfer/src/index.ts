import { AssetAmount, ConfigBuilder } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';

import { claimDeposits, claimWithdraws } from './claims';
import { sign } from './signers';
import { ctx, xcStore } from './setup';
import { logAssets, logSrcChains, logDestChains } from './utils';

const { config, wallet } = ctx;

// Define transfer constraints
const srcChain = config.getChain('hydration');
const destChain = config.getChain('assethub');
const asset = config.getAsset('dot');

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
const srcAddr = '12ZuLmUNjTz5HgYneqXpoYh7hVSFNJnwsh6NgivdF2wb9GcH';
const destAddr = '12ZuLmUNjTz5HgYneqXpoYh7hVSFNJnwsh6NgivdF2wb9GcH';

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
const transferAmount = '0.01';

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

/***************************/
/**** Helper functions *****/
/***************************/

function subscribeStore(address: string) {
  xcStore.subscribe(address, {
    onLoad(j) {
      console.log('History:', j);
    },
    onNew(j) {
      console.log('New:', j);
    },
    onUpdate(j, p) {
      console.log('Updated:', j, p);
    },
    onOpen() {
      console.log('Live stream started...');
    },
    onError(err) {
      console.error('Live stream error', err);
    },
  });
}
