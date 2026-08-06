import { Ntt, SolanaChain } from '@galacticcouncil/xc-core';

import {
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptAccount,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';

import { ExecutorBudgetBuilder } from './types';

// Upstream returns 250k for svm; 26 sampled redeems peaked at 87_592 CU.
const GAS_LIMIT = 250_000n;

// Lamports a redeem costs the fee payer with the recipient ata already open.
// A redeem is four transactions - verify_signatures, verify_signatures,
// post_vaa, then receive/redeem/release - and permanently creates the
// transceiver-message and inbox-item pdas. Measured on mainnet at 9_292_040
// across the three managers routed to here; rounded up for headroom.
//
// The earlier 6_000_000 was measured over the last transaction alone, which is
// why it under-funded even the ata-exists case.
const REDEEM_LAMPORTS = 10_000_000n;

// Rent-exempt minimum of a 165 byte token account, used when the ata cannot
// be read. Matches getMinimumBalanceForRentExemptAccount on mainnet.
const ATA_RENT_FALLBACK = 2_039_280n;

/**
 * An svm redeem mints into the recipient's associated token account and the
 * relayer opens it when missing, so its rent is charged only then - mirroring
 * upstream, which adds it on `getAccountInfo(ata) === null`.
 *
 * Budgeting it unconditionally would be simpler, but the executor charges
 * source native for lamports it fronts, so every transfer to an existing
 * account would pay for rent nobody spends.
 */
export const SolanaExecutorBudget = (): ExecutorBudgetBuilder => ({
  build: async ({ destination, asset, recipient }) => {
    const budget = { gasLimit: GAS_LIMIT, msgValue: REDEEM_LAMPORTS };

    // Without a recipient the ata cannot be checked. Assume it is missing:
    // over-quoting delays nothing, under-quoting aborts the relay.
    if (!asset || !recipient) {
      return {
        ...budget,
        msgValue: budget.msgValue + ATA_RENT_FALLBACK,
      };
    }

    const ctx = destination as SolanaChain;
    const ntt = Ntt.fromChain(ctx, asset);
    const mint = new PublicKey(ntt.token);

    // Token-2022 mints are owned by a different program & the ata is derived
    // from whichever one holds the mint.
    const mintAccount = await ctx.connection.getAccountInfo(mint);
    const ata = getAssociatedTokenAddressSync(
      mint,
      new PublicKey(recipient),
      true,
      mintAccount?.owner ?? TOKEN_PROGRAM_ID
    );

    const account = await ctx.connection.getAccountInfo(ata);
    if (account) {
      return budget;
    }

    const rent = await getMinimumBalanceForRentExemptAccount(ctx.connection);
    return {
      ...budget,
      msgValue: budget.msgValue + BigInt(rent),
    };
  },
});
