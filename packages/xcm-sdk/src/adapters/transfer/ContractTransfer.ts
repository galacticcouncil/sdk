import {
  AnyEvmChain,
  AssetAmount,
  ContractConfig,
  EvmClient,
} from '@galacticcouncil/xcm-core';

import { EvmTransferFactory } from './evm';
import { TransferProvider } from '../types';
import { XCall } from '../../types';

export class ContractTransfer implements TransferProvider<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.client;
  }

  async calldata(account: string, config: ContractConfig): Promise<XCall> {
    const { data, abi, address } = EvmTransferFactory.get(this.#client, config);
    return {
      abi: JSON.stringify(abi),
      data: data as `0x${string}`,
      from: account as `0x${string}`,
      to: address as `0x${string}`,
    } as XCall;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<AssetAmount> {
    console.log(config);
    const contract = EvmTransferFactory.get(this.#client, config);

    let fee: bigint;
    try {
      fee = await contract.estimateFee(account, amount);
    } catch (error) {
      // Can't estimate fee if no allowance
      fee = 0n;
    }

    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
