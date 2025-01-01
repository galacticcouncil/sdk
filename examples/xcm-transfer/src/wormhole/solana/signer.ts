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
  SendTransactionError,
  TransactionExpiredBlockheightExceededError,
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
const DEFAULT_PERCENTILE_MULTIPLE = 1;
const DEFAULT_MIN_PRIORITY_FEE = 1;
const DEFAULT_MAX_PRIORITY_FEE = 1e9;

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
    console.log('tx', tx);
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

      let priorityFeeIx: TransactionInstruction[] | undefined;
      if (this._priorityFee?.percentile && this._priorityFee.percentile > 0)
        priorityFeeIx = await createPriorityFeeInstructions(
          this._rpc,
          transaction,
          this._priorityFee.percentile,
          this._priorityFee.percentileMultiple,
          this._priorityFee.min,
          this._priorityFee.max
        );
      console.log('priority', priorityFeeIx);
      console.log(extraSigners);

      const res = await determineComputeBudget(this._rpc, transaction);
      console.log(res);

      logTxDetails(transaction);

      if (isVersionedTransaction(transaction)) {
        transaction.message.recentBlockhash = blockhash;
        //transaction.sign([this._keypair, ...(extraSigners ?? [])]);
      } else {
        if (priorityFeeIx) transaction.add(...priorityFeeIx);
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        //transaction.partialSign(this._keypair, ...(extraSigners ?? []));
      }

      if (!isVersionedTransaction(transaction)) {
        const mssg = new TransactionMessage({
          payerKey: this._keypair.publicKey,
          recentBlockhash: blockhash,
          instructions: transaction.instructions,
        }).compileToV0Message();

        const transactionHex = Buffer.from(transaction.serialize()).toString(
          'hex'
        );

        const mssgHex = Buffer.from(mssg.serialize()).toString('hex');
        const mssgArray = Uint8Array.from(Buffer.from(mssgHex, 'hex'));
        const mssgOrig = MessageV0.deserialize(mssgArray);

        console.log(TransactionMessage.decompile(mssg));
        console.log(TransactionMessage.decompile(mssgOrig));

        const versioned = new VersionedTransaction(mssgOrig);
        //versioned.sign([this._keypair, ...(extraSigners ?? [])]);
        console.log(versioned);
        //sendTxWithRetry(this._rpc, versioned.serialize());
      }

      console.log(transaction);
      //sendTxWithRetry(this._rpc, transaction.serialize());
    }
    return txids;
  }
}

/**
 *
 * @param connection a Solana/web3.js Connection to the network
 * @param transaction the transaction to determine the compute budget for
 * @param feePercentile the percentile of recent fees to use
 * @param multiple the multiple to apply to the percentile fee
 * @param minPriorityFee the minimum priority fee to use
 * @param maxPriorityFee the maximum priority fee to use
 * @returns an array of TransactionInstructions to set the compute budget and priority fee for the transaction
 */
export async function createPriorityFeeInstructions(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  feePercentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
  multiple: number = DEFAULT_PERCENTILE_MULTIPLE,
  minPriorityFee: number = DEFAULT_MIN_PRIORITY_FEE,
  maxPriorityFee: number = DEFAULT_MAX_PRIORITY_FEE
): Promise<TransactionInstruction[]> {
  const [computeBudget, priorityFee] = await Promise.all([
    determineComputeBudget(connection, transaction),
    determinePriorityFee(
      connection,
      transaction,
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
 * A helper function to determine the priority fee to use for a transaction
 *
 * @param connection Solana/web3.js Connection to the network
 * @param transaction The transaction to determine the priority fee for
 * @param percentile The percentile of recent fees to use
 * @param multiple The multiple to apply to the percentile fee
 * @param minPriorityFee The minimum priority fee to use
 * @param maxPriorityFee The maximum priority fee to use
 * @returns the priority fee to use according to the recent transactions and the given parameters
 */
export async function determinePriorityFee(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  percentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
  multiple: number = DEFAULT_PERCENTILE_MULTIPLE,
  minPriorityFee: number = DEFAULT_MIN_PRIORITY_FEE,
  maxPriorityFee: number = DEFAULT_MAX_PRIORITY_FEE
): Promise<number> {
  // https://twitter.com/0xMert_/status/1768669928825962706

  // Start with min fee
  let fee = minPriorityFee;

  // Figure out which accounts need write lock
  let lockedWritableAccounts: PublicKey[] = [];
  if (isVersionedTransaction(transaction)) {
    const luts = (
      await Promise.all(
        transaction.message.addressTableLookups.map((acc) =>
          connection.getAddressLookupTable(acc.accountKey)
        )
      )
    )
      .map((lut) => lut.value)
      .filter((val) => val !== null) as AddressLookupTableAccount[];
    const msg = transaction.message;
    const keys = msg.getAccountKeys({
      addressLookupTableAccounts: luts ?? undefined,
    });
    lockedWritableAccounts = msg.compiledInstructions
      .flatMap((ix) => ix.accountKeyIndexes)
      .map((k) => (msg.isAccountWritable(k) ? keys.get(k) : null))
      .filter((k) => k !== null) as PublicKey[];
  } else {
    lockedWritableAccounts = transaction.instructions
      .flatMap((ix) => ix.keys)
      .map((k) => (k.isWritable ? k.pubkey : null))
      .filter((k) => k !== null) as PublicKey[];
  }

  try {
    const recentFeesResponse = await connection.getRecentPrioritizationFees({
      lockedWritableAccounts,
    });

    if (recentFeesResponse) {
      // Sort fees to find the appropriate percentile
      const recentFees = recentFeesResponse
        .map((dp) => dp.prioritizationFee)
        .sort((a, b) => a - b);

      // Find the element in the distribution that matches the percentile requested
      const idx = Math.ceil(recentFees.length * percentile);
      if (recentFees.length > idx) {
        let percentileFee = recentFees[idx]!;

        // Apply multiple if provided
        if (multiple > 0) percentileFee *= multiple;

        fee = Math.max(fee, percentileFee);
      }
    }
  } catch (e) {
    console.error('Error fetching Solana recent fees', e);
  }

  // Bound the return value by the parameters pased
  return Math.min(Math.max(fee, minPriorityFee), maxPriorityFee);
}

/**
 * A helper function to determine the compute budget to use for a transaction
 * @param connection Solana/web3.js Connection to the network
 * @param transaction The transaction to determine the compute budget for
 * @returns the compute budget to use for the transaction
 */
export async function determineComputeBudget(
  connection: Connection,
  transaction: Transaction | VersionedTransaction
): Promise<number> {
  let computeBudget = DEFAULT_COMPUTE_BUDGET;
  try {
    const simulateResponse = await connection.simulateTransaction(
      transaction as Transaction
    );

    console.log(simulateResponse);

    if (simulateResponse.value.err)
      console.error(
        `Error simulating Solana transaction: ${simulateResponse.value.err}`
      );

    if (simulateResponse?.value?.unitsConsumed) {
      // Set compute budget to 120% of the units used in the simulated transaction
      computeBudget = Math.round(simulateResponse.value.unitsConsumed * 1.2);
    }
  } catch (e) {
    console.error(
      `Failed to calculate compute unit limit for Solana transaction: ${e}`
    );
  }
  return computeBudget;
}

export function logTxDetails(transaction: Transaction | VersionedTransaction) {
  if (isVersionedTransaction(transaction)) {
    console.log(transaction.signatures);
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
    console.log(transaction.signatures);
    console.log(transaction.feePayer);
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
