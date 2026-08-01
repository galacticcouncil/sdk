import { AnyChain, EvmParachain } from '@galacticcouncil/xc-core';
import { WhStatus, WhTransfer } from '@galacticcouncil/xc-sdk';

import { sign, signSolanaBundle } from '../signers';
import { xc } from '../setup';

const { config, wormhole } = xc;

export type Logger = (...args: unknown[]) => void;

/** Claim payer, resolved per destination chain. */
export type PayerOf = (chain: AnyChain) => string;

const describe = (transfer: WhTransfer) =>
  [
    transfer.amount,
    transfer.assetSymbol,
    transfer.fromChain.key,
    '->',
    transfer.toChain.key,
  ].join(' ');

/**
 * Report every wormhole operation of the account, both directions.
 *
 * An operation never becomes a transfer when its emitter matches no
 * registered ntt deployment, so an empty claim run is otherwise
 * indistinguishable from having nothing to claim. Wormholescan filters
 * by sender, hence the separate lookup of what targets the parachain.
 */
async function survey(account: string, matched: number, log: Logger) {
  const hydration = config.getChain('hydration') as EvmParachain;
  const { filters, whScan } = wormhole.transfer;

  const address = await hydration.getDerivatedAddress(account);
  const [sent, received] = await Promise.all([
    whScan.getOperations({ ...filters, address }),
    whScan.getOperations({ ...filters, targetChain: '73' }),
  ]);
  const inbound = received.filter(
    (o) =>
      o.content.standarizedProperties.toAddress.toLowerCase() ===
      address.toLowerCase()
  );

  log(address, '- sent', sent.length + ',', 'received', inbound.length);
  const operations = [...sent, ...inbound];
  if (operations.length > matched) {
    log('Emitters seen - unmatched ones have no ntt registry entry:');
    operations.forEach((o) =>
      log(' ', 'chain', o.emitterChain, o.emitterAddress.native)
    );
  }
}

/**
 * Redeem every claimable transfer, reporting the ones that aren't.
 *
 * A transfer carries no `redeem` until the vaa is signed, once
 * wormholescan reports the target completed, or when the token has no
 * registered deployment on the destination chain.
 */
async function claim(
  transfers: WhTransfer[],
  account: string,
  payerOf: PayerOf,
  log: Logger
) {
  for (const transfer of transfers) {
    if (!transfer.redeem) {
      log('Skip', describe(transfer), '-', WhStatus[transfer.status]);
      continue;
    }

    const chain = transfer.toChain;
    // The claim is a transaction on the destination chain, so the payer is
    // whatever account signs there - an evm, solana or sui one.
    const payer = payerOf(chain);

    log('Claim', describe(transfer), 'paid by', payer);
    const calls = await transfer.redeem(payer);

    if (!Array.isArray(calls)) {
      await sign(calls, chain);
    } else if (chain.isSolana()) {
      // Jito bundle execution
      await signSolanaBundle(calls, chain);
    } else {
      // Sequential batch execution
      for (const call of calls) {
        await sign(call, chain);
      }
    }

    log('Claimed', describe(transfer));
  }

  if (!transfers.some((t) => t.redeem)) {
    await survey(account, transfers.length, log);
  }
}

/**
 * Check hydration withdrawals and claim stucked
 *
 * @param account - hydration account (for)
 * @param payer - claim payer (from)
 * @param log - progress reporter
 */
export async function claimWithdraws(
  account: string,
  payerOf: PayerOf,
  log: Logger = console.log
) {
  const withdraws = await wormhole.transfer.getWithdraws(account);
  log('Withdrawals:', withdraws.length);
  await claim(withdraws, account, payerOf, log);
}

/**
 * Check hydration deposits and claim stucked
 *
 * @param account - hydration account (for)
 * @param payer - claim payer (from)
 * @param log - progress reporter
 */
export async function claimDeposits(
  account: string,
  payerOf: PayerOf,
  log: Logger = console.log
) {
  const deposits = await wormhole.transfer.getDeposits(account);
  log('Deposits:', deposits.length);
  await claim(deposits, account, payerOf, log);
}
