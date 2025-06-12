import { ApiPromise } from '@polkadot/api';
import { type SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { type CallDryRunEffects } from '@polkadot/types/interfaces';

import { PublicClient } from 'viem';

import { AAVE_GAS_LIMIT, AaveUtils } from '../aave';
import { PolkadotApiClient } from '../api';
import { BalanceClient } from '../client';
import { EvmClient } from '../evm';
import { PoolType } from '../pool';
import { Swap } from '../sor';

import { SubstrateTransaction } from './types';

export abstract class TxBuilder extends PolkadotApiClient {
  protected readonly evm: EvmClient;
  protected readonly evmClient: PublicClient;

  protected readonly balanceClient: BalanceClient;
  protected readonly aaveUtils: AaveUtils;

  constructor(api: ApiPromise, evm: EvmClient) {
    super(api);
    this.evm = evm;
    this.evmClient = evm.getWsProvider();
    this.balanceClient = new BalanceClient(api);
    this.aaveUtils = new AaveUtils(evm);
  }

  protected wrapTx(
    name: string,
    tx: SubmittableExtrinsic
  ): SubstrateTransaction {
    return {
      hex: tx.toHex(),
      name,
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    };
  }

  protected async dryRun(
    account: string,
    extrinsic: SubmittableExtrinsic
  ): Promise<CallDryRunEffects> {
    let result;
    try {
      result = await this.api.call.dryRunApi.dryRunCall(
        {
          System: { Signed: account },
        },
        extrinsic.inner.toHex()
      );
    } catch (e) {
      console.error(e);
      throw new Error('Dry run execution failed!');
    }

    if (result.isOk) {
      return result.asOk;
    }
    console.log(result.asErr.toHuman());
    throw new Error('Dry run execution error!');
  }

  protected dispatchWithExtraGas(
    tx: SubmittableExtrinsic
  ): SubmittableExtrinsic {
    return this.api.tx.dispatcher['dispatchWithExtraGas'](
      tx.inner.toHex(),
      AAVE_GAS_LIMIT
    );
  }

  protected isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
