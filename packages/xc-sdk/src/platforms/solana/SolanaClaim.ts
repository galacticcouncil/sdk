import {
  CallType,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import {
  Connection,
  Keypair,
  MessageV0,
  PublicKey,
  PublicKeyInitData,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
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

import { utils as tutils } from '@wormhole-foundation/sdk-solana';
import { utils as cutils } from '@wormhole-foundation/sdk-solana-core';

import { encoding } from '@wormhole-foundation/sdk-base';
import { deserialize } from '@wormhole-foundation/sdk-definitions';

import {
  createCompleteTransferNativeInstruction,
  createCompleteTransferWrappedInstruction,
} from '@wormhole-foundation/sdk-solana-tokenbridge';

import { SolanaCall } from './types';
import { chunkBySize, ixToHuman, serializeV0 } from './utils';

import { SolanaLilJit } from './SolanaLilJit';

export class SolanaClaim {
  readonly #chain: SolanaChain;
  readonly #connection: Connection;
  readonly #lilJit: SolanaLilJit;

  constructor(chain: SolanaChain) {
    this.#chain = chain;
    this.#connection = chain.connection;
    this.#lilJit = new SolanaLilJit(chain);
  }

  async redeem(from: string, vaaRaw: string): Promise<SolanaCall[]> {
    const ctxWh = Wh.fromChain(this.#chain);

    const vaaBytes = encoding.b64.decode(vaaRaw);
    // We don't check for TokenBridge:TransferWithPayload because claim (complete_wrapped_with_payload)
    // must be called via CPI from the redeemer program only if using TokenRelayer
    const vaa = deserialize('TokenBridge:Transfer', vaaBytes);
    const vaaU8a = deserialize('Uint8Array', vaaBytes);
    const postedVaaAddress = this.derivePostedVaaKey(
      ctxWh.getCoreBridge(),
      Buffer.from(vaa.hash)
    );

    const payer = new PublicKey(from);
    const calls: SolanaCall[] = [];

    const posted = await this.#connection.getAccountInfo(postedVaaAddress);
    if (!posted) {
      const signatureSet = Keypair.generate();
      const verifyIxs = await cutils.createVerifySignaturesInstructions(
        this.#chain.connection,
        ctxWh.getCoreBridge(),
        payer,
        vaaU8a,
        signatureSet.publicKey
      );

      const chunks = chunkBySize(verifyIxs, 1000);
      for (let i = 0; i < chunks.length; i++) {
        const sigIx = chunks[i];
        const sigV0 = await this.getV0Message(payer, sigIx);
        const sigTx = serializeV0(sigV0);
        calls.push({
          from: from,
          data: sigTx,
          ix: ixToHuman(sigIx),
          signers: [signatureSet],
          type: CallType.Solana,
        } as SolanaCall);
      }

      const postVaaIx = cutils.createPostVaaInstruction(
        this.#connection,
        ctxWh.getCoreBridge(),
        payer,
        vaaU8a,
        signatureSet.publicKey
      );
      const postVaaV0 = await this.getV0Message(payer, [postVaaIx]);
      const postVaaTx = serializeV0(postVaaV0);
      calls.push({
        from: from,
        data: postVaaTx,
        ix: ixToHuman([postVaaIx]),
        type: CallType.Solana,
      } as SolanaCall);
    }

    const isNative = vaa.payload.token.chain === 'Solana';
    const mint = new PublicKey(vaa.payload.token.address.toUint8Array());
    const isNativeSol = isNative && mint.equals(NATIVE_MINT);

    const tipAccounts = await this.#lilJit.getTipAccount();
    const tipIx = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(tipAccounts[0]),
      lamports: 1000,
    });

    if (isNativeSol) {
      const completeCall = await this.redeemAndUnwrap(
        payer,
        vaa,
        ctxWh,
        tipIx
      );
      calls.push(completeCall);
    } else {
      const createCompleteTransferInstruction = isNative
        ? createCompleteTransferNativeInstruction
        : createCompleteTransferWrappedInstruction;
      const completeIx = createCompleteTransferInstruction(
        this.#connection,
        ctxWh.getTokenBridge(),
        ctxWh.getCoreBridge(),
        payer,
        vaa
      );

      const ata = getAssociatedTokenAddressSync(mint, payer);
      const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
        payer,
        ata,
        payer,
        mint
      );

      const completeV0 = await this.getV0Message(payer, [
        createAtaIx,
        completeIx,
        tipIx,
      ]);
      const completeTx = serializeV0(completeV0);
      calls.push({
        from: payer.toBase58(),
        data: completeTx,
        ix: ixToHuman([createAtaIx, completeIx]),
        type: CallType.Solana,
      } as SolanaCall);
    }

    return calls;
  }

  private async redeemAndUnwrap(
    payer: PublicKey,
    vaa: any,
    ctxWh: any,
    tipIx: TransactionInstruction
  ): Promise<SolanaCall> {
    const targetPublicKey = new PublicKey(
      vaa.payload.to.address.toUint8Array()
    );
    const mintInfo = await getMint(this.#connection, NATIVE_MINT);
    const targetAmount =
      vaa.payload.token.amount *
      BigInt(Math.pow(10, mintInfo.decimals - 8));
    const rentBalance = await getMinimumBalanceForRentExemptAccount(
      this.#connection
    );

    const ancillaryKeypair = Keypair.generate();

    const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      payer,
      targetPublicKey,
      payer,
      NATIVE_MINT
    );

    const completeIx = createCompleteTransferNativeInstruction(
      this.#connection,
      ctxWh.getTokenBridge(),
      ctxWh.getCoreBridge(),
      payer,
      vaa
    );

    const createAncillaryIx = SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: ancillaryKeypair.publicKey,
      lamports: rentBalance,
      space: ACCOUNT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });

    const initAncillaryIx = createInitializeAccountInstruction(
      ancillaryKeypair.publicKey,
      NATIVE_MINT,
      payer
    );

    const transferIx = createTransferInstruction(
      targetPublicKey,
      ancillaryKeypair.publicKey,
      payer,
      targetAmount
    );

    const closeIx = createCloseAccountInstruction(
      ancillaryKeypair.publicKey,
      payer,
      payer
    );

    const ixs = [
      createAtaIx,
      completeIx,
      createAncillaryIx,
      initAncillaryIx,
      transferIx,
      closeIx,
      tipIx,
    ];

    const completeV0 = await this.getV0Message(payer, ixs);
    const completeTx = serializeV0(completeV0);
    return {
      from: payer.toBase58(),
      data: completeTx,
      ix: ixToHuman(ixs),
      signers: [ancillaryKeypair],
      type: CallType.Solana,
    } as SolanaCall;
  }

  private derivePostedVaaKey(
    wormholeProgramId: PublicKeyInitData,
    hash: Buffer
  ): PublicKey {
    return tutils.deriveAddress(
      [Buffer.from('PostedVAA'), hash],
      wormholeProgramId
    );
  }

  private async getV0Message(
    payer: PublicKey,
    ixs: TransactionInstruction[]
  ): Promise<MessageV0> {
    const { blockhash } =
      await this.#connection.getLatestBlockhash('finalized');
    return new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message();
  }
}
