import {
  AnyEvmChain,
  AssetAmount,
  ContractConfig,
  EvmClient,
  Precompile,
} from '@galacticcouncil/xcm-core';

import { EvmTransferFactory } from './evm';
import { TransferProvider } from '../types';
import { Erc20Client } from '../../evm';
import { XCall } from '../../types';

export class ContractTransfer implements TransferProvider<ContractConfig> {
  readonly #client: EvmClient;

  constructor(chain: AnyEvmChain) {
    this.#client = chain.client;
  }

  private isPrecompile(address: string): boolean {
    const precompiles = Object.entries(Precompile).map(([_, v]) => v);
    return precompiles.includes(address);
  }

  async calldata(
    account: string,
    amount: bigint,
    config: ContractConfig
  ): Promise<XCall> {
    const { abi, asset, data } = EvmTransferFactory.get(this.#client, config);
    const erc20 = new Erc20Client(this.#client, asset);

    const transferCall = {
      abi: JSON.stringify(abi),
      data: data as `0x${string}`,
      from: account as `0x${string}`,
      to: config.address as `0x${string}`,
    } as XCall;

    if (this.isPrecompile(config.address)) {
      return transferCall;
    }

    const allowance = await erc20.allowance(account, config.address);
    if (allowance >= amount) {
      return transferCall;
    }

    const approve = erc20.approve(config.address, amount);
    return {
      abi: JSON.stringify(erc20.abi),
      data: approve as `0x${string}`,
      from: account as `0x${string}`,
      to: asset as `0x${string}`,
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
