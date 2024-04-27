import {
  AnyChain,
  AssetAmount,
  BaseConfig,
  ChainType,
  EvmChain,
  EvmParachain,
  Parachain,
} from '@galacticcouncil/xcm-core';

import { SubstrateTransfer } from './SubstrateTransfer';
import { ContractTransfer } from './ContractTransfer';

import { XCall } from '../../types';
import { TransferProvider } from '../types';

export class TransferAdapter {
  private readonly providers: Record<string, TransferProvider<BaseConfig>> = {};

  constructor(chain: AnyChain) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        this.providers.Evm = new ContractTransfer(chain as EvmChain);
        break;
      case ChainType.EvmParachain:
        this.providers.Evm = new ContractTransfer(chain as EvmParachain);
        this.providers.Substrate = new SubstrateTransfer(chain as EvmParachain);
        break;
      case ChainType.Parachain:
        this.providers.Substrate = new SubstrateTransfer(chain as Parachain);
        break;
      default:
        throw new Error('Unsupported platform');
    }
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: BaseConfig
  ): Promise<AssetAmount> {
    return this.providers[config.type].estimateFee(
      account,
      amount,
      feeBalance,
      config
    );
  }

  async calldata(
    account: string,
    amount: bigint,
    config: BaseConfig
  ): Promise<XCall> {
    return this.providers[config.type].calldata(account, amount, config);
  }
}
