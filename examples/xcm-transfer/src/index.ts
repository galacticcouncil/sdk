import {
  AssetAmount,
  ConfigBuilder,
  Parachain,
  SolanaChain,
} from '@galacticcouncil/xcm-core';
import {
  SolanaLilJit,
  SubstrateCall,
  TransferBuilder,
} from '@galacticcouncil/xcm-sdk';

import { logAssets, logSrcChains, logDestChains } from './utils';
import { configService, wallet, whTransfers } from './setup';
import { sign, signSubstrate, signSolanaBundle } from './signers';

// Define transfer constraints
const srcChain = configService.getChain('base');
const destChain = configService.getChain('hydration');
const asset = configService.getAsset('eurc');

const configBuilder = ConfigBuilder(configService);
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
const transferAmount = '1';

const [call, fee] = await Promise.all([
  transfer.buildCall(transferAmount),
  transfer.estimateFee(transferAmount),
]);

// Dump transfer info
console.log(transfer);
console.log(status);
console.log(
  'Estimated fee:',
  [fee.toDecimal(fee.decimals), fee.originSymbol].join(' ')
);
console.log(call);
console.log('Dry run:', await call.dryRun());

// Unsubscribe source chain balance
balanceSubscription.unsubscribe();

/***************************/
/**** Helper functions *****/
/***************************/

/**
 * Check hydration withdrawals and claim stucked
 *
 * @param account - hydration account (for)
 * @param payer - claim payer (from)
 */
async function claimWithdraws(account: string, payer: string) {
  const withdraws = await whTransfers.getWithdraws(account);

  for (const withdrawal of withdraws) {
    if (withdrawal.redeem) {
      console.log(withdrawal);
      const calls = await withdrawal.redeem(payer);
      const isBatch = Array.isArray(calls);
      if (isBatch && withdrawal.toChain.isSolana()) {
        // Jito bundle execution
        await signSolanaBundle(calls, destChain);
      } else if (isBatch) {
        // Sequential batch execution
        for (const call of calls) {
          await sign(call, destChain);
        }
      } else {
        await sign(call, destChain);
      }
    }
  }
}

/**
 * Check hydration deposits and claim stucked
 *
 * @param account - hydration account (for)
 * @param payer - claim payer (from)
 */
async function claimDeposits(account: string, payer: string) {
  const srcChain = configService.getChain('hydration') as Parachain;
  const destChain = configService.getChain('moonbeam') as Parachain;
  const feeAsset = srcChain.findAssetById('10'); // default to system

  const deposits = await whTransfers.getDeposits(account);

  for (const deposit of deposits) {
    if (deposit.redeem) {
      console.log(deposit);
      const call = await deposit.redeem(payer);
      const isBatch = Array.isArray(call);
      if (isBatch) {
        throw Error('Batch not supported');
      } else {
        const remoteTx = await wallet.remoteXcm(
          payer,
          srcChain,
          destChain,
          call as SubstrateCall,
          { srcFeeAsset: feeAsset?.asset }
        );
        await signSubstrate(remoteTx, srcChain);
      }
    }
  }
}
