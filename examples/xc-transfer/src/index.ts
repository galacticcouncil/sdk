import { AssetAmount, ConfigBuilder } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';
import { tags } from '@galacticcouncil/xc-cfg';

import { sign } from './signers';
import { xc } from './setup';
import { log } from './utils';

const { Tag } = tags;

const BRIDGES = [
  Tag.Wormhole.toString(),
  Tag.Snowbridge.toString(),
  Tag.Basejump.toString(),
];

const { logAssets, logSrcChains, logDestChains } = log;
const { config, wallet } = xc;

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

// Snapshot all source chain balances once (e.g. for an asset picker list)
const balances = await wallet.getBalances(srcAddr, srcChain);
console.log(balances);

// Subscribe live balance for the selected asset only
const balanceObserver = (balances: AssetAmount[]) => console.log(balances);
const balanceSubscription = await wallet.subscribeBalance(
  srcAddr,
  srcChain,
  [asset],
  balanceObserver
);

const transfers = TransferBuilder(wallet)
  .withAsset(asset)
  .withSource(srcChain)
  .withDestination(destChain);

const { destinationAssets, routes, isAssetSelect, isTagSelect } = transfers;

if (isAssetSelect) {
  const destAssets = destinationAssets.map((a) => a.key);
  console.log('Destination assets:', destAssets);
}

if (isTagSelect) {
  const bridgeOptions = routes
    .map((r) => r.tags)
    .filter((tags) => !!tags)
    .map((group) => BRIDGES.find((bridge) => group.includes(bridge)))
    .filter((x) => x);
  console.log('Bridge options:', bridgeOptions);
}

// Build transfer input data
const transfer = await transfers.build({
  srcAddress: srcAddr,
  dstAddress: destAddr,
});

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
