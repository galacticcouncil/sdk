import { ProgramConfig } from '@galacticcouncil/xcm-core';

import {
  AddressLookupTableAccount,
  Connection,
  ComputeBudgetProgram,
  MessageV0,
  PublicKey,
  SimulatedTransactionResponse,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

const DEFAULT_PRIORITY_FEE_PERCENTILE = 0.5;
const DEFAULT_PERCENTILE_MULTIPLE = 2;
const DEFAULT_MIN_PRIORITY_FEE = 1;
const DEFAULT_MAX_PRIORITY_FEE = 1e6;

const DEFAULT_COMPUTE_BUDGET = 250_000;

export class SolanaTransfer {
  readonly connection: Connection;
  readonly config: ProgramConfig;

  constructor(connection: Connection, config: ProgramConfig) {
    this.validateConnection(connection);
    this.connection = connection;
    this.config = config;
  }

  private validateConnection(connection: Connection) {
    if (!connection) {
      throw new Error(`No connection found`);
    }
  }

  async getPriorityMessage(account: string): Promise<MessageV0> {
    const { instructions } = this.config;
    const message = await this.getV0Message(account, instructions);
    const priorityFeeIx = await this.createPriorityFeeInstructions(message);
    return this.getV0Message(account, [...instructions, ...priorityFeeIx]);
  }

  async estimateFee(account: string, balance: bigint): Promise<bigint> {
    if (balance === 0n) {
      return 0n;
    }

    const { instructions } = this.config;
    const message = await this.getV0Message(account, instructions);
    const budget = await this.determineComputeBudget(message);
    return BigInt(budget);
  }

  private async getV0Message(
    account: string,
    instructions: TransactionInstruction[]
  ): Promise<MessageV0> {
    const payerKey = new PublicKey(account);
    const { blockhash } = await this.connection.getLatestBlockhash('finalized');
    return new TransactionMessage({
      payerKey: payerKey,
      recentBlockhash: blockhash,
      instructions: instructions,
    }).compileToV0Message();
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

  async simulateTransaction(
    account: string,
    message: MessageV0
  ): Promise<SimulatedTransactionResponse> {
    const transaction = new VersionedTransaction(message);
    const simulateResponse = await this.connection.simulateTransaction(
      transaction,
      {
        accounts: {
          encoding: 'base64',
          addresses: [account],
        },
      }
    );
    return simulateResponse.value;
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
    const simulateResponse =
      await this.connection.simulateTransaction(transaction);

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
    const recentFeesResponse =
      await this.connection.getRecentPrioritizationFees({
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
          this.connection.getAddressLookupTable(acc.accountKey)
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
