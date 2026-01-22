import { Parachain } from '@galacticcouncil/xc-core';
import { SubstrateCall } from '@galacticcouncil/xc-sdk';

import { sign, signSubstrate, signSolanaBundle } from './signers';
import { ctx } from './setup';

const { config, wallet, wormhole } = ctx;

/**
 * Check hydration withdrawals and claim stucked
 *
 * @param account - hydration account (for)
 * @param payer - claim payer (from)
 */
export async function claimWithdraws(account: string, payer: string) {
  const withdraws = await wormhole.transfer.getWithdraws(account);

  for (const withdrawal of withdraws) {
    if (withdrawal.redeem) {
      console.log(withdrawal);
      const calls = await withdrawal.redeem(payer);
      const chain = withdrawal.toChain;

      const isBatch = Array.isArray(calls);
      if (isBatch && withdrawal.toChain.isSolana()) {
        // Jito bundle execution
        await signSolanaBundle(calls, chain);
      } else if (isBatch) {
        // Sequential batch execution
        for (const call of calls) {
          await sign(call, chain);
        }
      } else {
        await sign(calls, chain);
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
export async function claimDeposits(account: string, payer: string) {
  const srcChain = config.getChain('hydration') as Parachain;
  const destChain = config.getChain('moonbeam') as Parachain;
  const feeAsset = srcChain.findAssetById('10'); // default to system

  const deposits = await wormhole.transfer.getDeposits(account);

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
