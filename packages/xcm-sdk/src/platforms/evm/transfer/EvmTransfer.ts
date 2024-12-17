import { ContractConfig, EvmClient } from '@galacticcouncil/xcm-core';
import { Abi, BaseError } from 'viem';

export class EvmTransfer {
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

  get abi(): Abi {
    return this.config.abi;
  }

  get asset(): string {
    const args = this.config.args;
    const [asset] = args;
    return asset;
  }

  get calldata(): string {
    return this.config.encodeFunctionData();
  }

  async estimateGas(account: string): Promise<bigint> {
    const { address, args, value, func } = this.config;
    const provider = this.client.getProvider();
    return await provider.estimateContractGas({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: func,
      args: args,
      value: value,
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
      const estimatedGas = await this.estimateGas(account);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (error) {
      const err = error as BaseError;
      console.log("Can't estimate fees. " + err.shortMessage);
      return 0n;
    }
  }
}
