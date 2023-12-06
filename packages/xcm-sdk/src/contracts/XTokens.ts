import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { encodeFunctionData } from 'viem';

import { EvmClient } from '../evm';

import abi from './XTokensABI.json';

export class XTokens {
  readonly address = '0x0000000000000000000000000000000000000804';
  readonly #client: EvmClient;
  readonly #config: ContractConfig;

  constructor(client: EvmClient, config: ContractConfig) {
    this.validateClient(client);
    this.#client = client;
    this.#config = config;
  }

  private validateClient(client: EvmClient) {
    if (!client) {
      throw new Error(`No EVM client found`);
    }
  }

  get abi(): string {
    return JSON.stringify(abi);
  }

  get data(): string {
    const { func, args } = this.#config;
    return encodeFunctionData({
      abi: abi,
      functionName: func,
      args: args,
    });
  }

  async getEstimatedGas(account: string): Promise<bigint> {
    const { func, args } = this.#config;
    const provider = this.#client.getProvider();
    return await provider.estimateContractGas({
      address: this.address as `0x${string}`,
      abi: abi,
      functionName: func,
      args: args,
      account: account as `0x${string}`,
    });
  }

  async getGasPrice(): Promise<bigint> {
    return this.#client.getProvider().getGasPrice();
  }

  async getFee(account: string, amount: bigint): Promise<bigint> {
    if (amount === 0n) {
      return 0n;
    }

    try {
      const estimatedGas = await this.getEstimatedGas(account);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (error) {
      console.log(error);
      throw new Error(
        "Can't get a fee. Make sure that you have enough balance!"
      );
    }
  }
}
