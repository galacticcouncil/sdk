import { sign, signSolanaBundle } from '../signers';
import { xc } from '../setup';

const { wormhole } = xc;

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
      if (isBatch && chain.isSolana()) {
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
  const deposits = await wormhole.transfer.getDeposits(account);

  for (const deposit of deposits) {
    if (deposit.redeem) {
      console.log(deposit);
      const calls = await deposit.redeem(payer);
      const chain = deposit.toChain;

      const isBatch = Array.isArray(calls);
      if (isBatch && chain.isSolana()) {
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
