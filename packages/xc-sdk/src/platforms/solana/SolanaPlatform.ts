import {
  AssetAmount,
  CallType,
  ProgramConfig,
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
    configs: ProgramConfig[]
  ): Promise<SolanaCall[]> {
    return Promise.all(configs.map((config) => this.buildTx(account, config)));
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

  /**
   * Fee of a transfer.
   *
   * Read off the transfer transaction alone - it is the last of the sequence
   * and the only one whose simulation reports the sender's final balance.
   */
  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    configs: ProgramConfig[]
  ): Promise<AssetAmount> {
    const config = configs[configs.length - 1];
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
