import { ProgramConfig } from '@galacticcouncil/xcm-core';

import {
  Connection,
  ComputeBudgetProgram,
  MessageV0,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

import {
  determinePriorityFee,
  determineComputeBudget,
} from '@wormhole-foundation/sdk-solana';

const DEFAULT_PRIORITY_FEE_PERCENTILE = 0.5;
const DEFAULT_PERCENTILE_MULTIPLE = 2;
const DEFAULT_MIN_PRIORITY_FEE = 1;
const DEFAULT_MAX_PRIORITY_FEE = 1000;

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
    const transaction = new VersionedTransaction(message);
    const budget = await this.determineComputeBudget(transaction);
    return BigInt(budget);
  }

  private async getV0Message(
    account: string,
    instructions: TransactionInstruction[]
  ): Promise<MessageV0> {
    const payerKey = new PublicKey(account);
    const { blockhash } = await this.connection.getLatestBlockhash();
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
    const transaction = new VersionedTransaction(message);
    const [computeBudget, priorityFee] = await Promise.all([
      this.determineComputeBudget(transaction),
      this.determinePriorityFee(
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
   * Determine the priority fee to use for a transaction
   *
   * @param transaction - the transaction to determine the priority fee for
   * @param percentile - the percentile of recent fees to use
   * @param multiple - the multiple to apply to the percentile fee
   * @param minPriorityFee - the minimum priority fee to use
   * @param maxPriorityFee - the maximum priority fee to use
   * @returns the priority fee to use according to the recent transactions and the given parameters
   */
  private async determinePriorityFee(
    transaction: VersionedTransaction,
    percentile: number = DEFAULT_PRIORITY_FEE_PERCENTILE,
    multiple: number = DEFAULT_PERCENTILE_MULTIPLE,
    minPriorityFee: number = DEFAULT_MIN_PRIORITY_FEE,
    maxPriorityFee: number = DEFAULT_MAX_PRIORITY_FEE
  ) {
    return determinePriorityFee(
      this.connection,
      transaction,
      percentile,
      multiple,
      minPriorityFee,
      maxPriorityFee
    );
  }

  /**
   * Determine compute budget from simulated transaction
   *
   * @param transaction - versioned transaction
   * @returns Compute budget to 120% of the units used in the simulated transaction
   */
  private async determineComputeBudget(
    transaction: VersionedTransaction
  ): Promise<number> {
    return determineComputeBudget(this.connection, transaction);
  }
}
