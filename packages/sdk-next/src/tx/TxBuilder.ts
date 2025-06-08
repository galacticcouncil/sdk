import { Enum, PolkadotClient } from 'polkadot-api';

import { AAVE_GAS_LIMIT, AaveUtils } from '../aave';
import { Papi } from '../api';
import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { PoolType } from '../pool';
import { Swap } from '../sor';

import { DryRunResult, Transaction, Tx } from './types';
import { enumPath } from './utils';

export abstract class TxBuilder extends Papi {
  protected readonly evmClient: EvmClient;
  protected readonly balanceClient: BalanceClient;
  protected readonly aaveUtils: AaveUtils;

  constructor(client: PolkadotClient, evmClient?: EvmClient) {
    super(client);
    this.evmClient = evmClient ?? new EvmClient();
    this.balanceClient = new BalanceClient(client);
    this.aaveUtils = new AaveUtils(this.evmClient);
  }

  protected wrapTx(name: string, tx: Transaction): Tx {
    return {
      name,
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    };
  }

  protected async dispatchWithExtraGas(tx: Transaction): Promise<Transaction> {
    return this.api.tx.Dispatcher.dispatch_with_extra_gas({
      call: tx.decodedCall,
      extra_gas: AAVE_GAS_LIMIT,
    });
  }

  protected async dryRun(
    account: string,
    tx: Transaction
  ): Promise<DryRunResult> {
    const rawOrigin = Enum('Signed', account);
    const origin = Enum('system', rawOrigin);

    const dryRun = await this.client
      .getUnsafeApi()
      .apis.DryRunApi.dry_run_call(origin, tx.decodedCall);

    const result = dryRun as DryRunResult;
    const error =
      result.success && !result.value.execution_result.success
        ? result.value.execution_result.value.error
        : null;

    if (error) {
      const errorPath = enumPath(error.value);
      throw new Error('Dry run execution error!', {
        cause: errorPath,
      });
    }
    return result;
  }

  protected isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
