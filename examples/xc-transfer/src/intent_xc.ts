import { ConfigBuilder } from '@galacticcouncil/xc-core';
import { TransferBuilder } from '@galacticcouncil/xc-sdk';
import {
  OneClickService,
  QuoteRequest,
} from '@defuse-protocol/one-click-sdk-typescript';

import { sign } from './signers';
import { ctx } from './setup';
import { log } from './utils';

const { logAssets, logSrcChains, logDestChains } = log;
const { config, wallet } = ctx;

// Define transfer constraints
const srcChain = config.getChain('hydration');
const destChain = config.getChain('ethereum');
const asset = config.getAsset('usdc_mwh');

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

// Define source account (recipient = same address on dest chain)
const sender = 'INSERT_ADDRESS';
const recipient = 'INSERT_ADDRESS';
const refund = 'INSERT_ADDRESS';

// Transfer amount in the smallest unit (e.g. 1 USDC = 1_000_000)
const transferAmount = '0.5';
const amountInSmallestUnit = '500000';

// 1) Create NEAR intent — request a 1Click quote.
// The response contains the depositAddress on the origin chain
// where the funds need to be sent for the swap to execute.
const quoteRequest: QuoteRequest = {
  dry: false,
  swapType: QuoteRequest.swapType.EXACT_INPUT,
  slippageTolerance: 100,
  originAsset:
    'nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near',
  depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
  destinationAsset: 'nep141:wrap.near',
  amount: amountInSmallestUnit,
  refundTo: refund,
  refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
  recipient: recipient,
  recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
  deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
};

console.log('Quote:');
const quote = await OneClickService.getQuote(quoteRequest);
console.log(JSON.stringify(quote, null, 2));

const depositAddress = quote.quote.depositAddress;
if (!depositAddress) throw new Error('No depositAddress in quote response.');

const transfers = TransferBuilder(wallet)
  .withAsset(asset)
  .withSource(srcChain)
  .withDestination(destChain);

// 2) Build the transfer to the depositAddress returned by 1Click.
const transfer = await transfers.build({
  srcAddress: sender,
  dstAddress: depositAddress,
});

const status = await transfer.validate();

const [call, fee] = await Promise.all([
  transfer.buildCall(transferAmount),
  transfer.estimateFee(transferAmount),
]);

console.log(transfer);
console.log(status);
console.log('Estimated fee:', [fee.toDecimal(), fee.originSymbol].join(' '));
console.log(call);
console.log('Dry run:', await call.dryRun());

// 3) Sign and send the transfer.
// await sign(call, srcChain);

// 4) Submit deposit tx to 1Click to speed up settlement.

// const submit = await OneClickService.submitDepositTx({
//   depositAddress,
//   txHash,
// });
// console.log(JSON.stringify(submit, null, 2));

// const status = await OneClickService.getExecutionStatus(depositAddress);
// console.log(JSON.stringify(status, null, 2));
