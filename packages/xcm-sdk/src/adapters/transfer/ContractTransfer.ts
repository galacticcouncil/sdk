import {
  AnyEvmChain,
  AssetAmount,
  CallType,
  ContractConfig,
  EvmClient,
} from '@galacticcouncil/xcm-core';

import { EvmTransferFactory } from './evm';
import { isNativeEthBridge, isPrecompile } from './evm/utils';
import { TransferProvider } from '../types';
import { Erc20Client } from '../../evm';
import { XCall, XCallEvm } from '../../types';

export class ContractTransfer implements TransferProvider<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.client;
  }

  async calldata(
    account: string,
    amount: bigint,
    config: ContractConfig
  ): Promise<XCall> {
    const { abi, asset, calldata } = EvmTransferFactory.get(
      this.#client,
      config
    );

    const transferCall = {
      abi: JSON.stringify(abi),
      data: calldata as `0x${string}`,
      from: account as `0x${string}`,
      to: config.address as `0x${string}`,
      value: config.value,
      type: CallType.Evm,
    } as XCallEvm;

    if (isPrecompile(config) || isNativeEthBridge(config)) {
      return transferCall;
    }

    const erc20 = new Erc20Client(this.#client, asset);
    const allowance = await erc20.allowance(account, config.address);
    if (allowance >= amount) {
      return transferCall;
    }

    const approve = erc20.approve(config.address, amount);
    return {
      abi: JSON.stringify(erc20.abi),
      allowance: allowance,
      data: approve as `0x${string}`,
      from: account as `0x${string}`,
      to: asset as `0x${string}`,
      type: CallType.Evm,
    } as XCallEvm;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<AssetAmount> {
    const contract = EvmTransferFactory.get(this.#client, config);
    const fee = await contract.estimateFee(account, amount);
    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
