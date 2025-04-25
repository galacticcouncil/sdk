import {
  AddressLookupTableAccount,
  Connection,
  MessageV0,
  PublicKey,
  SendOptions,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  ComputeBudgetProgram,
  Keypair,
  TransactionMessage,
} from '@solana/web3.js';
import type {
  Network,
  SignAndSendSigner,
  Signer,
  UnsignedTransaction,
} from '@wormhole-foundation/sdk-connect';
import { encoding } from '@wormhole-foundation/sdk-connect';
import {
  SolanaPlatform,
  SolanaChains,
  SolanaUnsignedTransaction,
  isVersionedTransaction,
} from '@wormhole-foundation/sdk-solana';

import { sendTxWithRetry } from './send';

const DEFAULT_PRIORITY_FEE_PERCENTILE = 0.5;
const DEFAULT_PERCENTILE_MULTIPLE = 2;
const DEFAULT_MIN_PRIORITY_FEE = 1;
const DEFAULT_MAX_PRIORITY_FEE = 1e6;

const DEFAULT_MAX_RESUBMITS = 5;
const DEFAULT_COMPUTE_BUDGET = 250_000;

/** Options for setting the priority fee for a transaction */
export type PriorityFeeOptions = {
  /** The percentile of recent fees to use as a base fee */
  percentile?: number;
  /** The multiple to apply to the percentile base fee  */
  percentileMultiple?: number;
  /** The minimum priority fee to use */
  min?: number;
  /** The maximum priority fee to use */
  max?: number;
};

/** Recommended priority fee options */
export const DefaultPriorityFeeOptions: PriorityFeeOptions = {
  percentile: DEFAULT_PRIORITY_FEE_PERCENTILE,
  percentileMultiple: DEFAULT_PERCENTILE_MULTIPLE,
  min: DEFAULT_MIN_PRIORITY_FEE,
  max: DEFAULT_MAX_PRIORITY_FEE,
};

/** Options for the SolanaSendSigner  */
export type SolanaSendSignerOptions = {
  /** log details of transaction attempts  */
  debug?: boolean;
  /** determine compute budget and priority fees to land a transaction */
  priorityFee?: PriorityFeeOptions;
  /** any send options from solana/web3.js */
  sendOpts?: SendOptions;
  /** how many times to attempt resubmitting the transaction to the network with a new blockhash */
  retries?: number;
};

// returns a SignAndSendSigner for the Solana platform
export async function getSolanaSignAndSendSigner(
  rpc: Connection,
  privateKey: string | Keypair,
  opts?: SolanaSendSignerOptions
): Promise<Signer> {
  const [_, chain] = await SolanaPlatform.chainFromRpc(rpc);

  const kp =
    typeof privateKey === 'string'
      ? Keypair.fromSecretKey(encoding.b58.decode(privateKey))
      : privateKey;

  return new SolanaSendSigner(
    rpc,
    chain,
    kp,
    opts?.debug ?? false,
    opts?.priorityFee ?? {},
    opts?.retries ?? DEFAULT_MAX_RESUBMITS,
    opts?.sendOpts
  );
}

export class SolanaSendSigner<
  N extends Network,
  C extends SolanaChains = 'Solana',
> implements SignAndSendSigner<N, C>
{
  constructor(
    private _rpc: Connection,
    private _chain: C,
    private _keypair: Keypair,
    private _debug: boolean = false,
    private _priorityFee: PriorityFeeOptions,
    private _maxResubmits: number = DEFAULT_MAX_RESUBMITS,
    private _sendOpts?: SendOptions
  ) {
    this._sendOpts = this._sendOpts ?? {
      preflightCommitment: this._rpc.commitment,
    };
  }

  chain(): C {
    return this._chain;
  }

  address(): string {
    return this._keypair.publicKey.toBase58();
  }

  async signAndSend(tx: UnsignedTransaction[]): Promise<any[]> {
    let { blockhash, lastValidBlockHeight } = await SolanaPlatform.latestBlock(
      this._rpc
    );

    const txids: string[] = [];
    for (const txn of tx) {
      const {
        description,
        transaction: { transaction, signers: extraSigners },
      } = txn as SolanaUnsignedTransaction<N, C>;

      console.log(`Signing: ${description} for ${this.address()}`);

      const transactionRaw = transaction as Transaction;
      const mssg = new TransactionMessage({
        payerKey: this._keypair.publicKey,
        recentBlockhash: blockhash,
        instructions: transactionRaw.instructions,
      }).compileToV0Message();

      const priorityFeeIx: TransactionInstruction[] =
        await this.createPriorityFeeInstructions(
          mssg,
          this._priorityFee.percentile,
          this._priorityFee.percentileMultiple,
          this._priorityFee.min,
          this._priorityFee.max
        );

      const budget = await this.determineComputeBudget(mssg);

      //console.log('Priority', priorityFeeIx);
      //console.log('Extra signers', extraSigners);
      console.log('Compute budget:', budget);

      logTxDetails(transaction);
      transactionRaw.add(...priorityFeeIx);
      transactionRaw.recentBlockhash = blockhash;
      transactionRaw.lastValidBlockHeight = lastValidBlockHeight;
      transactionRaw.partialSign(this._keypair, ...(extraSigners ?? []));

      const mssgHex = Buffer.from(mssg.serialize()).toString('hex');
      const mssgArray = Uint8Array.from(Buffer.from(mssgHex, 'hex'));
      const mssgOrig = MessageV0.deserialize(mssgArray);

      const versioned = new VersionedTransaction(mssgOrig);
      versioned.sign([this._keypair, ...(extraSigners ?? [])]);

      const simulateResponse = await this._rpc.simulateTransaction(versioned, {
        accounts: {
          encoding: 'base64',
          addresses: [this.address()],
        },
      });

      console.log(simulateResponse);

      // Sign
      // sendTxWithRetry(this._rpc, transaction.serialize());
    }
    return txids;
  }

  private async createPriorityFeeInstructions(
    message: MessageV0,
    feePercentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
    multiple: number = DEFAULT_PERCENTILE_MULTIPLE,
    minPriorityFee: number = DEFAULT_MIN_PRIORITY_FEE,
    maxPriorityFee: number = DEFAULT_MAX_PRIORITY_FEE
  ): Promise<TransactionInstruction[]> {
    const [computeBudget, priorityFee] = await Promise.all([
      this.determineComputeBudget(message),
      this.determinePriorityFee(
        message,
        feePercentile,
        multiple,
        minPriorityFee,
        maxPriorityFee
      ),
    ]);

    return [
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeBudget,
      }),
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      }),
    ];
  }

  /**
   * Determine compute budget from simulated transaction
   *
   * @param transaction - versioned transaction
   * @returns Compute budget to 120% of the units used in the
   * simulated transaction or default
   */
  async determineComputeBudget(message: MessageV0): Promise<number> {
    const transaction = new VersionedTransaction(message);
    const simulateResponse = await this._rpc.simulateTransaction(transaction);

    const { err, unitsConsumed } = simulateResponse.value;
    if (unitsConsumed && !err) {
      return Math.round(unitsConsumed * 1.2);
    }

    return DEFAULT_COMPUTE_BUDGET;
  }

  /**
   * Determine the priority fee to use for a transaction
   *
   * @param transaction - the transaction to determine the priority fee for
   * @param percentile - the percentile of recent fees to use
   * @param multiple - the multiple to apply to the percentile fee
   * @param minPriorityFee - the minimum priority fee to use
   * @param maxPriorityFee - the maximum priority fee to use
   * @returns the priority fee to use according to the recent transactions and the given parameters
   */
  async determinePriorityFee(
    message: MessageV0,
    percentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
    multiple: number = DEFAULT_PERCENTILE_MULTIPLE,
    minPriorityFee: number = DEFAULT_MIN_PRIORITY_FEE,
    maxPriorityFee: number = DEFAULT_MAX_PRIORITY_FEE
  ): Promise<number> {
    // Start with min fee
    let fee = minPriorityFee;

    // Figure out tx accounts that needs write lock
    const lockedWritableAccounts = await this.getTxAccounts(message);
    const recentFeesResponse = await this._rpc.getRecentPrioritizationFees({
      lockedWritableAccounts,
    });

    if (recentFeesResponse) {
      // Sort fees to find the percentile
      const recentFees = recentFeesResponse
        .map((dp) => dp.prioritizationFee)
        .filter((f) => f > 0)
        .sort((a, b) => a - b);

      // Find the element in the distribution that matches the percentile
      const idx = Math.ceil(recentFees.length * percentile);

      if (recentFees.length > idx) {
        const percentileFee = recentFees[idx];
        const percentileFeeJuiced = percentileFee * multiple;
        fee = Math.max(fee, percentileFeeJuiced);
      }
    }

    return Math.min(Math.max(fee, minPriorityFee), maxPriorityFee);
  }

  private async getTxAccounts(message: MessageV0): Promise<PublicKey[]> {
    const luts = (
      await Promise.all(
        message.addressTableLookups.map((acc) =>
          this._rpc.getAddressLookupTable(acc.accountKey)
        )
      )
    )
      .map((lut) => lut.value)
      .filter((val) => val !== null) as AddressLookupTableAccount[];

    const keys = message.getAccountKeys({
      addressLookupTableAccounts: luts ?? undefined,
    });

    return message.compiledInstructions
      .flatMap((ix) => ix.accountKeyIndexes)
      .map((k) => (message.isAccountWritable(k) ? keys.get(k) : null))
      .filter((k) => k !== null) as PublicKey[];
  }
}

export function logTxDetails(transaction: Transaction | VersionedTransaction) {
  if (isVersionedTransaction(transaction)) {
    const msg = transaction.message;
    const keys = msg.getAccountKeys();
    msg.compiledInstructions.forEach((ix) => {
      console.log('V Program', keys.get(ix.programIdIndex)!.toBase58());
      console.log('V Data: ', encoding.hex.encode(ix.data));
      console.log(
        'V Keys: ',
        ix.accountKeyIndexes.map((k) => [k, keys.get(k)!.toBase58()])
      );
    });
  } else {
    transaction.instructions.forEach((ix) => {
      console.log('Program', ix.programId.toBase58());
      console.log('Data: ', ix.data.toString('hex'));
      console.log(
        'Keys: ',
        ix.keys.map((k) => [k, k.pubkey.toBase58()])
      );
    });
  }
}
