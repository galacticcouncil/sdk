import {
  AssetAmount,
  CallType,
  ProgramConfig,
  ProgramTx,
  SolanaChain,
} from '@galacticcouncil/xc-core';

import { Connection } from '@solana/web3.js';

import { Buffer } from 'buffer';

import { SolanaTransferFactory } from './transfer';
import { SolanaCall, SolanaDryRunResult } from './types';
import { ixToHuman } from './utils';

import { Platform } from '../types';

export class SolanaPlatform implements Platform<ProgramConfig> {
  readonly #connection: Connection;

  constructor(chain: SolanaChain) {
    this.#connection = chain.connection;
  }

  async buildCall(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ProgramConfig
  ): Promise<SolanaCall> {
    const [call] = await this.buildCalls(account, amount, feeBalance, config);
    return call as SolanaCall;
  }

  /**
   * Build the ordered transaction sequence of a transfer.
   *
   * All but the last are prerequisites the sender signs & sends first -
   * [wrapNative?, transfer]. Each is its own transaction because solana
   * caps transaction size.
   */
  async buildCalls(
    account: string,
    _amount: bigint,
    _feeBalance: AssetAmount,
    config: ProgramConfig
  ): Promise<SolanaCall[]> {
    const sequence: ProgramTx[] = [
      ...config.prerequisites,
      {
        instructions: config.instructions,
        signers: config.signers,
        lookupTables: config.lookupTables,
      },
    ];

    return Promise.all(
      sequence.map((tx) => this.buildProgramCall(account, config, tx))
    );
  }

  private async buildProgramCall(
    account: string,
    config: ProgramConfig,
    tx: ProgramTx
  ): Promise<SolanaCall> {
    const step = new ProgramConfig({
      instructions: tx.instructions,
      signers: tx.signers,
      lookupTables: tx.lookupTables,
      func: config.func,
      module: config.module,
    });
    return this.buildTx(account, step);
  }

  private async buildTx(
    account: string,
    config: ProgramConfig
  ): Promise<SolanaCall> {
    const transfer = SolanaTransferFactory.get(this.#connection, config);
    const mssgV0 = await transfer.getPriorityMessage(account);

    const mssgArray = mssgV0.serialize();
    const mssgHex = Buffer.from(mssgArray).toString('hex');
    return {
      from: account,
      data: mssgHex,
      ix: ixToHuman(config.instructions),
      signers: config.signers,
      type: CallType.Solana,
      dryRun: async () => {
        const { err, logs } = await transfer.simulateTransaction(
          account,
          mssgV0
        );

        return {
          call: config.module + '.' + config.func,
          error: err,
          events: logs,
        } as SolanaDryRunResult;
      },
    } as SolanaCall;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ProgramConfig
  ): Promise<AssetAmount> {
    const transfer = SolanaTransferFactory.get(this.#connection, config);
    const fee = await transfer.estimateFee(account, amount);
    const mssgV0 = await transfer.getPriorityMessage(account);
    const { accounts } = await transfer.simulateTransaction(account, mssgV0);

    const sender = accounts && accounts[0];
    const senderFinalBalance = sender?.lamports;

    if (senderFinalBalance) {
      const isSolTransfer =
        config.module === 'TokenBridge' &&
        config.func === 'TransferNativeWithPayload';

      return feeBalance.copyWith({
        amount:
          feeBalance.amount -
          BigInt(senderFinalBalance) -
          (isSolTransfer ? amount : 0n) +
          config.rentReserve,
      });
    }

    return feeBalance.copyWith({
      amount: fee + config.rentReserve,
    });
  }
}
