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

    const tipAccounts = await this.#lilJit.getTipAccount();
    const tipIx = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(tipAccounts[0]),
      lamports: DEFAULT_TIP_LAMPORTS,
    });

    const createAta = this.getCreateAta(ntt, vaa, payer);
    const unwrap = await this.getUnwrap(ntt, vaa, payer);

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
        // Before the release, which mints/unlocks into the recipient ata.
        ixs.unshift(createAta);
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
   * Create the recipient ata if missing (idempotent).
   *
   * The release only mints/unlocks into an existing token account, the
   * ntt program never creates it. Payer covers the rent.
   *
   * @param ntt - NTT token deployment on Solana
   * @param vaa - deserialized transfer, carries the recipient
   * @param payer - claim payer
   * @returns create ata instruction
   */
  private getCreateAta(
    ntt: NttTokenDef,
    vaa: VAA<'Ntt:WormholeTransfer'>,
    payer: PublicKey
  ): TransactionInstruction {
    const { recipientAddress } = vaa.payload.nttManagerPayload.payload;

    const mint = new PublicKey(ntt.token);
    const recipient = new PublicKey(recipientAddress.toUint8Array());
    const ata = getAssociatedTokenAddressSync(mint, recipient, true);

    return createAssociatedTokenAccountIdempotentInstruction(
      payer,
      ata,
      recipient,
      mint
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
