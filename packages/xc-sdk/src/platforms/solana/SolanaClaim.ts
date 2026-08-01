import {
  CallType,
  NttTokenDef,
  SolanaChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import {
  AddressLookupTableAccount,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import { encoding } from '@wormhole-foundation/sdk-base';
import { deserialize } from '@wormhole-foundation/sdk-definitions';
import { SolanaAddress } from '@wormhole-foundation/sdk-solana';
import { SolanaNtt } from '@wormhole-foundation/sdk-solana-ntt';
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

    const { blockhash } = await this.#connection.getLatestBlockhash();

    const calls: SolanaCall[] = [];
    for (const [i, { transaction, signers }] of txs.entries()) {
      const luts =
        'message' in transaction
          ? await getLookupTables(this.#connection, transaction.message)
          : [];
      const ixs = this.getInstructions(transaction, luts);
      if (i === txs.length - 1) {
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
        signers: signers ?? [],
        type: CallType.Solana,
      } as SolanaCall);
    }
    return calls;
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
