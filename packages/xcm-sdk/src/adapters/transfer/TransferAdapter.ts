import { BaseConfig } from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { SubstrateTransfer } from './SubstrateTransfer';
import { ContractTransfer } from './ContractTransfer';

import { EvmClient } from '../../evm';
import { SubstrateService } from '../../substrate';
import { XCall } from '../../types';
import { TransferProvider } from 'adapters/types';

export type TransferParams = {
  substrate: SubstrateService;
  evmClient?: EvmClient;
};

export class TransferAdapter {
  private readonly providers: Record<string, TransferProvider<BaseConfig>> = {};

  constructor({ substrate, evmClient }: TransferParams) {
    this.providers.Substrate = new SubstrateTransfer(substrate);
    if (evmClient) {
      this.providers.Evm = new ContractTransfer(evmClient);
    }
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: BaseConfig
  ): Promise<AssetAmount> {
    return this.providers[config.type].getFee(
      account,
      amount,
      feeBalance,
      config
    );
  }

  async calldata(account: string, config: BaseConfig): Promise<XCall> {
    return this.providers[config.type].calldata(account, config);
  }
}
