import {
  CallType,
  NttTokenDef,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  ACCOUNT_SIZE,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createInitializeAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptAccount,
  getMint,
} from '@solana/spl-token';

import { encoding } from '@wormhole-foundation/sdk-base';
import { deserialize, VAA } from '@wormhole-foundation/sdk-definitions';
import { SolanaAddress } from '@wormhole-foundation/sdk-solana';
import { register } from '@wormhole-foundation/sdk-definitions-ntt';

import { SolanaLilJit } from './SolanaLilJit';
import { SolanaCall } from './types';
import { getLookupTables, ixToHuman, serializeV0 } from './utils';

// Since 7.2.0 the ntt payload layouts are no longer registered on import.
register();

const DEFAULT_TIP_LAMPORTS = 1000;

export class SolanaClaim {
  readonly #chain: SolanaChain;
  readonly #connection: Connection;
  readonly #lilJit: SolanaLilJit;

  constructor(chain: SolanaChain) {
    this.#chain = chain;
    this.#connection = chain.connection;
    this.#lilJit = new SolanaLilJit(chain);
  }

  /**
   * Redeem NTT transfer on Solana.
   *
   * Posts the signed VAA to the core bridge & delivers it to the token
   * NTT program (receive + redeem + release). Yields multiple calls,
   * sign & send in order.
   *
   * @param from - payer address
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on Solana
   * @returns claim program calls
   */
  async redeem(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef
  ): Promise<SolanaCall[]> {
    const ctxWh = Wh.fromChain(this.#chain);

    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaa = deserialize('Ntt:WormholeTransfer', vaaBytes);

    // Lazy - the package esm dist doesn't load under node (broken import).
    const { SolanaNtt } = await import('@wormhole-foundation/sdk-solana-ntt');

    const solanaNtt = new SolanaNtt('Mainnet', 'Solana', this.#connection, {
      coreBridge: ctxWh.getCoreBridge(),
      ntt: {
        manager: ntt.manager,
        token: ntt.token,
        transceiver: { wormhole: ntt.transceiver.wormhole },
      },
    });

    const payer = new PublicKey(from);
    const payerAddress = new SolanaAddress(from);

    const txs = [];
    for await (const tx of solanaNtt.redeem([vaa], payerAddress)) {
      txs.push(tx.transaction);
    }

    const [tipIx, unwrap, openRecipient] = await Promise.all([
      this.getTip(payer),
      this.getUnwrap(ntt, vaa, payer),
      this.getOpenRecipient(ntt, vaa, payer),
    ]);

    const { blockhash } = await this.#connection.getLatestBlockhash();

    const calls: SolanaCall[] = [];
    for (const [i, { transaction, signers }] of txs.entries()) {
      const isLast = i === txs.length - 1;
      const luts =
        'message' in transaction
          ? await getLookupTables(this.#connection, transaction.message)
          : [];
      const ixs = this.getInstructions(transaction, luts);
      if (isLast) {
        ixs.unshift(openRecipient);
        // After the release, so the wSOL is already in the ata.
        if (unwrap) {
          ixs.push(...unwrap.ixs);
        }
        ixs.push(tipIx);
      }
      const mssgV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions: ixs,
      }).compileToV0Message(luts);
      calls.push({
        from: from,
        data: serializeV0(mssgV0),
        ix: ixToHuman(ixs),
        signers:
          isLast && unwrap
            ? [...(signers ?? []), unwrap.signer]
            : (signers ?? []),
        type: CallType.Solana,
      } as SolanaCall);
    }
    return calls;
  }

  /**
   * Release queued NTT transfer on Solana.
   *
   * Delivers the release for a transfer redeemed over the inbound rate
   * limit. Mints into the recipient ata once the queue timestamp is up,
   * no-op success before that (revertWhenNotReady is off).
   *
   * @param from - payer address
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on Solana
   * @returns release program call
   */
  async release(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef
  ): Promise<SolanaCall[]> {
    const ctxWh = Wh.fromChain(this.#chain);

    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaa = deserialize('Ntt:WormholeTransfer', vaaBytes);

    // Lazy - the package esm dist doesn't load under node (broken import).
    const { SolanaNtt } = await import('@wormhole-foundation/sdk-solana-ntt');

    const solanaNtt = new SolanaNtt('Mainnet', 'Solana', this.#connection, {
      coreBridge: ctxWh.getCoreBridge(),
      ntt: {
        manager: ntt.manager,
        token: ntt.token,
        transceiver: { wormhole: ntt.transceiver.wormhole },
      },
    });

    const payer = new PublicKey(from);
    const payerAddress = new SolanaAddress(from);

    const txs = [];
    for await (const tx of solanaNtt.completeInboundQueuedTransfer(
      vaa.emitterChain,
      vaa.payload.nttManagerPayload,
      payerAddress
    )) {
      txs.push(tx.transaction);
    }

    const [tipIx, unwrap, openRecipient] = await Promise.all([
      this.getTip(payer),
      this.getUnwrap(ntt, vaa, payer),
      this.getOpenRecipient(ntt, vaa, payer),
    ]);

    const { blockhash } = await this.#connection.getLatestBlockhash();

    const calls: SolanaCall[] = [];
    for (const { transaction, signers } of txs) {
      const luts =
        'message' in transaction
          ? await getLookupTables(this.#connection, transaction.message)
          : [];
      const ixs = this.getInstructions(transaction, luts);
      // Before the release, which mints/unlocks into the recipient ata.
      ixs.unshift(openRecipient);
      // After the release, so the wSOL is already in the ata.
      if (unwrap) {
        ixs.push(...unwrap.ixs);
      }
      ixs.push(tipIx);
      const mssgV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions: ixs,
      }).compileToV0Message(luts);
      calls.push({
        from: from,
        data: serializeV0(mssgV0),
        ix: ixToHuman(ixs),
        signers: unwrap ? [...(signers ?? []), unwrap.signer] : (signers ?? []),
        type: CallType.Solana,
      } as SolanaCall);
    }
    return calls;
  }

  /**
   * Jito tip, paid by the claim payer.
   *
   * A bundle is only picked up if it tips, so this is required rather than
   * best effort - an unreachable block engine fails the claim here instead
   * of sending a bundle that would never land.
   *
   * @param payer - claim payer, pays the tip
   * @returns tip instruction
   */
  private async getTip(payer: PublicKey): Promise<TransactionInstruction> {
    const accounts = await this.#lilJit.getTipAccount();
    return SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(accounts[0]),
      lamports: DEFAULT_TIP_LAMPORTS,
    });
  }

  /**
   * Open the recipient's token account.
   *
   * `release_inbound_mint` mints into the recipient ata and the program
   * never initializes it, while the reference sdk only opens one for the
   * payer - so relaying somebody else's transfer fails at release. Opening
   * an ata is permissionless, the payer just covers the rent.
   *
   * Emitted unconditionally: the idempotent variant is a no-op when the
   * account already exists, which is cheaper than the round-trip it would
   * take to find out - and safer, since the account can be closed between
   * the check and the release.
   *
   * @param ntt - NTT token deployment on Solana
   * @param vaa - deserialized transfer, carries the recipient
   * @param payer - claim payer, pays the rent
   * @returns create instruction
   */
  private async getOpenRecipient(
    ntt: NttTokenDef,
    vaa: VAA<'Ntt:WormholeTransfer'>,
    payer: PublicKey
  ): Promise<TransactionInstruction> {
    const { recipientAddress } = vaa.payload.nttManagerPayload.payload;
    const recipient = new PublicKey(recipientAddress.toUint8Array());
    const mint = new PublicKey(ntt.token);

    const mintAccount = await this.#connection.getAccountInfo(mint);
    const tokenProgram = mintAccount?.owner ?? TOKEN_PROGRAM_ID;

    const ata = getAssociatedTokenAddressSync(
      mint,
      recipient,
      true,
      tokenProgram
    );
    return createAssociatedTokenAccountIdempotentInstruction(
      payer,
      ata,
      recipient,
      mint,
      tokenProgram
    );
  }

  /**
   * Unwrap the released wSOL back into native sol.
   *
   * The manager only ever releases the spl token, so a native sol claim
   * leaves the recipient holding wSOL instead. Mirrors the token bridge
   * redeem: move the released amount into a throwaway wSOL account and
   * close it, which credits the lamports to its owner.
   *
   * Self redeem only - the wSOL lands in the recipient ata and nobody
   * else can move it out.
   *
   * @param ntt - NTT token deployment on Solana
   * @param vaa - deserialized transfer, carries the recipient & amount
   * @param payer - claim payer
   * @returns unwrap instructions & the throwaway account signer
   */
  private async getUnwrap(
    ntt: NttTokenDef,
    vaa: VAA<'Ntt:WormholeTransfer'>,
    payer: PublicKey
  ): Promise<{ ixs: TransactionInstruction[]; signer: Keypair } | undefined> {
    if (!new PublicKey(ntt.token).equals(NATIVE_MINT)) {
      return undefined;
    }

    const { recipientAddress, trimmedAmount } =
      vaa.payload.nttManagerPayload.payload;

    // Ntt carries the recipient wallet, unlike the token bridge which
    // carries its token account - the ata has to be derived.
    const recipient = new PublicKey(recipientAddress.toUint8Array());
    if (!recipient.equals(payer)) {
      return undefined;
    }

    const [mint, rent] = await Promise.all([
      getMint(this.#connection, NATIVE_MINT),
      getMinimumBalanceForRentExemptAccount(this.#connection),
    ]);

    // Ntt trims the amount to the smallest decimals of the two chains.
    const amount =
      trimmedAmount.amount *
      10n ** BigInt(mint.decimals - trimmedAmount.decimals);

    const ata = getAssociatedTokenAddressSync(NATIVE_MINT, recipient);
    const ancillary = Keypair.generate();

    return {
      signer: ancillary,
      ixs: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: ancillary.publicKey,
          lamports: rent,
          space: ACCOUNT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeAccountInstruction(
          ancillary.publicKey,
          NATIVE_MINT,
          payer
        ),
        createTransferInstruction(ata, ancillary.publicKey, payer, amount),
        createCloseAccountInstruction(ancillary.publicKey, payer, payer),
      ],
    };
  }

  private getInstructions(
    tx: Transaction | VersionedTransaction,
    luts: AddressLookupTableAccount[]
  ): TransactionInstruction[] {
    if ('message' in tx) {
      return TransactionMessage.decompile(tx.message, {
        addressLookupTableAccounts: luts,
      }).instructions;
    }
    return tx.instructions;
  }
}
