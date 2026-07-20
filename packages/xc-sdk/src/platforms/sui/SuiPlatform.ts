import {
  AssetAmount,
  CallType,
  MoveConfig,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { SuiClient } from '@mysten/sui/client';
import { toBase64 } from '@mysten/bcs';

import { SuiCall } from './types';
import { resolveCommandsTyped } from './utils';

import { DryRunResult, Platform } from '../types';

export class SuiPlatform implements Platform<MoveConfig> {
  readonly #client: SuiClient;

  constructor(chain: SuiChain) {
    this.#client = chain.client;
  }

  async buildCall(
    account: string,
    _amount: bigint,
    _feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<SuiCall> {
    const { transaction } = config;

    transaction.setSender(account);

    const txBytes = await transaction.build({ client: this.#client });
    const txJson = await transaction.toJSON();

    const commands = resolveCommandsTyped(JSON.parse(txJson));
    return {
      from: account,
      commands: commands,
      data: toBase64(txBytes),
      type: CallType.Sui,
      dryRun: async () => {
        const sim = await this.#client.dryRunTransactionBlock({
          transactionBlock: txBytes,
        });

        return {
          call: config.module + '.' + config.func,
          error: sim.executionErrorSource,
        } as DryRunResult;
      },
    } as SuiCall;
  }

  async estimateFee(
    account: string,
    _amount: bigint,
    feeBalance: AssetAmount,
    config: MoveConfig
  ): Promise<AssetAmount> {
    const { transaction } = config;

    transaction.setSender(account);
    const txBytes = await transaction.build({ client: this.#client });
    const sim = await this.#client.dryRunTransactionBlock({
      transactionBlock: txBytes,
    });

    const gasUsed = sim.effects.gasUsed;

    const computation = BigInt(gasUsed.computationCost);
    const storage = BigInt(gasUsed.storageCost);
    const mist = computation + storage;

    return feeBalance.copyWith({ amount: mist });
  }
}
