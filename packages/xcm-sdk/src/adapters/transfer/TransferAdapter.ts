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

import { TransferProvider } from '../types';
import { XCall } from '../../types';
import { Dex } from '../../Dex';

export class TransferAdapter {
  private readonly providers: Record<string, TransferProvider<BaseConfig>> = {};

  constructor(chain: AnyChain, dex: Dex) {
    switch (chain.getType()) {
      case ChainType.EvmChain:
        const evmChain = chain as EvmChain;
        this.providers.Evm = new ContractTransfer(evmChain);
        break;
      case ChainType.EvmParachain:
        const evmParachain = chain as EvmParachain;
        this.providers.Evm = new ContractTransfer(evmParachain);
        this.providers.Substrate = new SubstrateTransfer(evmParachain, dex);
        break;
      case ChainType.Parachain:
        const parachain = chain as Parachain;
        this.providers.Substrate = new SubstrateTransfer(parachain, dex);
        break;
      default:
        throw new Error('Unsupported platform: ' + chain.getType);
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
