import { ContractConfig, EvmClient } from '@galacticcouncil/xc-core';
import {
  Abi,
  BaseError,
  ContractFunctionExecutionError,
  Log,
  decodeEventLog,
} from 'viem';

import { EvmEventLog } from '../types';

type SimulateCallResult = {
  error: BaseError | undefined;
  logs: Log[] | undefined;
};

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

  async estimateFee(account: string, balance: bigint): Promise<bigint> {
    if (balance === 0n) {
      return 0n;
    }

    try {
      const estimatedGas = await this.estimateGas(account);
      const gasPrice = await this.getGasPrice();
      return estimatedGas * gasPrice;
    } catch (e) {
      if (e instanceof ContractFunctionExecutionError) {
        const err = e as ContractFunctionExecutionError;
        console.log("Can't estimate fees!\n", err.message);
      } else {
        console.log(e);
      }
      return 0n;
    }
  }

  async getGasPrice(): Promise<bigint> {
    return this.client.getProvider().getGasPrice();
  }

  async getNonce(account: string): Promise<number> {
    return this.client.getProvider().getTransactionCount({
      address: account as `0x${string}`,
    });
  }

  async simulateCall(account: string): Promise<SimulateCallResult> {
    const { address, args, value, func } = this.config;
    const provider = this.client.getProvider();
    const nonce = await this.getNonce(account);
    try {
      const { results } = await provider.simulateCalls({
        account: account as `0x${string}`,
        calls: [
          {
            to: address as `0x${string}`,
            abi: this.abi,
            functionName: func,
            args: args,
            value: value,
          },
        ],
        stateOverrides: [
          {
            address: account as `0x${string}`,
            nonce: nonce,
          },
        ],
      });
      const [result] = results;
      return result as SimulateCallResult;
    } catch (error) {
      const err = error as BaseError;
      console.log("Can't simulate call!\n", err.details);
      return {
        error: error,
      } as SimulateCallResult;
    }
  }

  decodeEvents(logs: Log[] | undefined): EvmEventLog[] {
    const decodedLogs: EvmEventLog[] = [];
    if (logs) {
      logs.forEach((l) => {
        try {
          const { eventName, args } = decodeEventLog({
            abi: this.abi,
            data: l.data,
            topics: l.topics,
          });
          decodedLogs.push({
            eventName: eventName,
            args: args,
          } as unknown as EvmEventLog);
        } catch (e) {}
      });
    }
    return decodedLogs;
  }
}
