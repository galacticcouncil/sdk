import {
  BaseConfig,
  CallType,
  ContractConfig,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { SubstrateTransferProvider } from './SubstrateTransferProvider';
import { EvmTransferProvider } from './EvmTransferProvider';
import { EvmTransferFactory } from './evm';

import { EvmClient } from '../../evm';
import { SubstrateService } from '../../substrate';
import { XCall } from '../../types';

export type TransferParams = {
  evmClient?: EvmClient;
  substrate: SubstrateService;
};

export class TransferAdapter {
  protected evmClient!: EvmClient;
  protected substrate: SubstrateService;

  private substrateProvider: SubstrateTransferProvider;
  private evmProvider!: EvmTransferProvider;

  constructor({ evmClient, substrate }: TransferParams) {
    this.substrate = substrate;
    this.substrateProvider = new SubstrateTransferProvider(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.evmProvider = new EvmTransferProvider(evmClient);
    }
  }

  async calldata(account: string, config: BaseConfig): Promise<XCall> {
    if (config.type === CallType.Evm) {
      const contract = EvmTransferFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.evmProvider.calldata(account, contract);
    }

    return this.substrateProvider.calldata(account, config as ExtrinsicConfig);
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: BaseConfig
  ): Promise<AssetAmount> {
    if (config.type === CallType.Evm) {
      const contract = EvmTransferFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.evmProvider.getFee(account, amount, feeBalance, contract);
    }

    return this.substrateProvider.getFee(
      account,
      amount,
      feeBalance,
      config as ExtrinsicConfig
    );
  }
}
