import {
  BaseConfig,
  CallType,
  ContractConfig,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { ExtrinsicTransfer } from './ExtrinsicTransfer';
import { ContractTransfer } from './ContractTransfer';
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

  private extrinsicTransfer: ExtrinsicTransfer;
  private contractTransfer!: ContractTransfer;

  constructor({ evmClient, substrate }: TransferParams) {
    this.substrate = substrate;
    this.extrinsicTransfer = new ExtrinsicTransfer(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.contractTransfer = new ContractTransfer();
    }
  }

  calldata(config: BaseConfig): XCall {
    if (config.type === CallType.Evm) {
      const contract = EvmTransferFactory.get(
        this.evmClient,
        config as ContractConfig
      );
      return this.contractTransfer.calldata(contract);
    }
    return this.extrinsicTransfer.calldata(config as ExtrinsicConfig);
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
      return this.contractTransfer.getFee(
        account,
        amount,
        feeBalance,
        contract
      );
    }

    return this.extrinsicTransfer.getFee(
      account,
      amount,
      feeBalance,
      config as ExtrinsicConfig
    );
  }
}
