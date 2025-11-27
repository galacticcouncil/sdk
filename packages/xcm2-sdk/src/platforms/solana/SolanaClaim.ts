import {
  CallType,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xcm2-core';

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

    const createCompleteTransferInstruction =
      vaa.payload.token.chain === 'Solana'
        ? createCompleteTransferNativeInstruction
        : createCompleteTransferWrappedInstruction;
    const completeIx = createCompleteTransferInstruction(
      this.#connection,
      ctxWh.getTokenBridge(),
      ctxWh.getCoreBridge(),
      payer,
      vaa
    );

    const tipAccounts = await this.#lilJit.getTipAccount();
    const tipIx = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: new PublicKey(tipAccounts[0]),
      lamports: 1000,
    });

    const completeV0 = await this.getV0Message(payer, [completeIx, tipIx]);
    const completeTx = serializeV0(completeV0);
    calls.push({
      from: from,
      data: completeTx,
      ix: ixToHuman([completeIx]),
      type: CallType.Solana,
    } as SolanaCall);
    return calls;
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
