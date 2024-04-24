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
      from: account as `0x${string}`,
      data: data as `0x${string}`,
      abi: JSON.stringify(abi),
      to: address,
    } as XCall;
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ContractConfig
  ): Promise<AssetAmount> {
    console.log(config);
    const contract = EvmTransferFactory.get(this.#client, config);

    let fee: bigint;
    try {
      fee = await contract.getFee(account, amount);
    } catch (error) {
      // Can't estimate fee if no allowance
      fee = 0n;
    }

    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
