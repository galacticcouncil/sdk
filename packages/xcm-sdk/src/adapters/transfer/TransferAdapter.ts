import {
  BaseConfig,
  CallType,
  ContractConfig,
  ExtrinsicConfig,
} from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { ExtrinsicTransfer } from './ExtrinsicTransfer';
import { XTokensTransfer } from './XTokensTransfer';

import { XTokens } from '../../contracts';
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
  private xTokensTransfer!: XTokensTransfer;

  constructor({ evmClient, substrate }: TransferParams) {
    this.substrate = substrate;
    this.extrinsicTransfer = new ExtrinsicTransfer(substrate);

    if (evmClient) {
      this.evmClient = evmClient;
      this.xTokensTransfer = new XTokensTransfer();
    }
  }

  calldata(config: BaseConfig): XCall {
    if (config.type === CallType.Evm) {
      const xTokens = new XTokens(this.evmClient, config as ContractConfig);
      return this.xTokensTransfer.calldata(xTokens);
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
      const xTokens = new XTokens(this.evmClient, config as ContractConfig);
      return this.xTokensTransfer.getFee(account, amount, feeBalance, xTokens);
    }

    return this.extrinsicTransfer.getFee(
      account,
      amount,
      feeBalance,
      config as ExtrinsicConfig
    );
  }
}
