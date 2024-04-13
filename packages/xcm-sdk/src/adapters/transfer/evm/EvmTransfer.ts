import { Abi } from '@galacticcouncil/xcm-core';
import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { encodeFunctionData, BaseError } from 'viem';

import { EvmClient } from '../../../evm';

export abstract class EvmTransfer {
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

  abstract _abi(): any;
  abstract _precompile(): string;

  get abi(): any {
    return this._abi();
  }

  get address(): string {
    const { address } = this.#config;
    if (address) {
      return address;
    }
    return this._precompile();
  }

  get data(): string {
    const { func, args } = this.#config;
    return encodeFunctionData({
      abi: this.abi,
      functionName: func,
      args: args,
    });
  }

  async getEstimatedGas(account: string): Promise<bigint> {
    const { func, args } = this.#config;
    const provider = this.#client.getProvider();
    return await provider.estimateContractGas({
      address: this.address as `0x${string}`,
      abi: this.abi,
      functionName: func,
      args: args,
      account: account as `0x${string}`,
    });
  }

  async getGasPrice(): Promise<bigint> {
    return this.#client.getProvider().getGasPrice();
  }

  async getAllowance(account: string): Promise<bigint> {
    const { args } = this.#config;
    const [owner] = args;
    const provider = this.#client.getProvider();
    const output = await provider.readContract({
      address: owner as `0x${string}`,
      abi: Abi.IERC20,
      functionName: 'allowance',
      args: [this.address as `0x${string}`, account as `0x${string}`],
    });
    return output as bigint;
  }

  async getFee(account: string, amount: bigint): Promise<bigint> {
    if (amount === 0n) {
      return 0n;
    }
    /* 
    const allowance = await this.getAllowance(account);
    console.log(allowance); */

    try {
      const estimatedGas = await this.getEstimatedGas(account);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (error) {
      const err = error as BaseError;
      console.log(err.message);
      throw new Error("Can't estimate fees. " + err.shortMessage);
    }
  }
}
