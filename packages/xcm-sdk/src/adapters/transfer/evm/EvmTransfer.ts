import { ContractConfig, EvmClient } from '@galacticcouncil/xcm-core';
import { encodeFunctionData, BaseError } from 'viem';
import { isNativeEthBridge } from './utils';

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
  abstract get asset(): string;

  get data(): string {
    const { args, func } = this.config;
    return encodeFunctionData({
      abi: this.abi,
      functionName: func,
      args: args,
    });
  }

  async estimateGas(account: string, balance: bigint): Promise<bigint> {
    const { address, args, func } = this.config;
    const provider = this.client.getProvider();
    return await provider.estimateContractGas({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: func,
      args: args,
      value: isNativeEthBridge(this.config) ? balance : undefined,
      account: account as `0x${string}`,
    });
  }

  async getGasPrice(): Promise<bigint> {
    return this.client.getProvider().getGasPrice();
  }

  async estimateFee(account: string, balance: bigint): Promise<bigint> {
    if (balance === 0n) {
      return 0n;
    }

    try {
      const estimatedGas = await this.estimateGas(account, balance);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (error) {
      const err = error as BaseError;
      console.log(err.message);
      throw new Error("Can't estimate fees. " + err.shortMessage);
    }
  }
}
