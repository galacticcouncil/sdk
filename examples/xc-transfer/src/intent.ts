import { CallType, EvmChain } from '@galacticcouncil/xc-core';
import { EvmCall } from '@galacticcouncil/xc-sdk';
import {
  OneClickService,
  QuoteRequest,
} from '@defuse-protocol/one-click-sdk-typescript';
import { encodeFunctionData } from 'viem';

import { signEvm } from './signers';
import { ctx } from './setup';

const { config } = ctx;

// Define intent constraints — deposit USDC on Ethereum, swap to NEAR.
const srcChain = config.getChain('ethereum') as EvmChain;
const evmClient = srcChain.evmClient;

// Define source account
const sender = 'INSERT_ADDRESS';
const recipient = 'INSERT_ADDRESS';

// Deposit amount in the smallest unit (e.g. 0.5 USDC = 500_000)
const amountInSmallestUnit = '970000000';

const USDC_ON_ETHEREUM = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as const;

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const;

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
  refundTo: sender,
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

// 2) Build the ERC20 transfer call to the depositAddress returned by 1Click.
const data = encodeFunctionData({
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [depositAddress as `0x${string}`, BigInt(amountInSmallestUnit)],
});

const call: EvmCall = {
  from: sender,
  to: USDC_ON_ETHEREUM,
  data,
  type: CallType.Evm,
  dryRun: async () => undefined,
};

signEvm(call, srcChain, async (hash) => {
  console.log('Waiting for confirmation…');
  const receipt = await evmClient
    .getProvider()
    .waitForTransactionReceipt({ hash: hash as '0x{string}' });
  console.log(
    'Confirmed in block:',
    receipt.blockNumber,
    'status:',
    receipt.status
  );

  // 4) Submit deposit tx to 1Click to speed up settlement.
  console.log('\nSubmit:');
  const submit = await OneClickService.submitDepositTx({
    depositAddress,
    txHash: hash,
  });
  console.log(JSON.stringify(submit, null, 2));

  console.log('\nStatus:');
  const status = await OneClickService.getExecutionStatus(depositAddress);
  console.log(JSON.stringify(status, null, 2));
});
