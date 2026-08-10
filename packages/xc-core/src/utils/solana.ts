import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

/**
 * Solana token account derivation.
 *
 * Shared because both halves of an ntt transfer need it: the executor budget
 * charges the recipient ata's rent only when it has to be opened, and the
 * claim opens it. Deriving it two ways would let those two disagree.
 */

export type TokenAccount = {
  ata: PublicKey;
  /** Program holding the mint, which the ata is derived under. */
  tokenProgram: PublicKey;
};

/**
 * Associated token account of an owner, with the program owning the mint.
 *
 * Token-2022 mints are held by a different program than the original spl
 * token program and the ata is derived from whichever one holds the mint,
 * so it is read from chain rather than assumed.
 */
export async function getTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<TokenAccount> {
  const mintAccount = await connection.getAccountInfo(mint);
  const tokenProgram = mintAccount?.owner ?? TOKEN_PROGRAM_ID;
  return {
    ata: getAssociatedTokenAddressSync(mint, owner, true, tokenProgram),
    tokenProgram,
  };
}
