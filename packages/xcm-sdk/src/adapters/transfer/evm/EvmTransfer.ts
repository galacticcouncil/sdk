import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { encodeFunctionData, BaseError } from 'viem';

import { EvmClient } from '../../../evm';

export abstract class EvmTransfer {
  protected readonly client: EvmClient;
  protected readonly config: ContractConfig;

  constructor(client: EvmClient, config: ContractConfig) {
    this.validateClient(client);
    this.client = client;
    this.config = config;
  }

  private validateClient(client: EvmClient) {
    if (!client) {
      throw new Error(`No EVM client found`);
    }
  }

  abstract get abi(): any;
  abstract get address(): string;
  abstract get asset(): string;
  abstract get amount(): string;

  get data(): string {
    const { func, args } = this.config;
    return encodeFunctionData({
      abi: this.abi,
      functionName: func,
      args: args,
    });
  }

  async getGasEstimation(account: string): Promise<bigint> {
    const { func, args } = this.config;
    const provider = this.client.getProvider();
    return await provider.estimateContractGas({
      address: this.address as `0x${string}`,
      abi: this.abi,
      functionName: func,
      args: args,
      account: account as `0x${string}`,
    });
  }

  async getGasPrice(): Promise<bigint> {
    return this.client.getProvider().getGasPrice();
  }

  async getFee(account: string, balance: bigint): Promise<bigint> {
    if (balance === 0n) {
      return 0n;
    }

    try {
      const estimatedGas = await this.getGasEstimation(account);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (error) {
      const err = error as BaseError;
      console.log(err.message);
      throw new Error("Can't estimate fees. " + err.shortMessage);
    }
  }
}
