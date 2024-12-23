import { encodeFunctionData } from 'viem';

import { Abi } from './abi';
import { EvmClient } from './EvmClient';

import { addr } from '../utils';

export class Erc20Client {
  readonly client: EvmClient;
  readonly address: string;

  constructor(client: EvmClient, address: string) {
    this.validateClient(client);
    this.validateContract(address);
    this.client = client;
    this.address = address;
  }

  private validateClient(client: EvmClient) {
    if (!client) {
      throw new Error(`No EVM client found`);
    }
  }

  private validateContract(address: string) {
    if (!address) {
      throw new Error('Contract address is required');
    }
    this.validateContractAddress(address);
  }

  private validateContractAddress(address: string) {
    if (!addr.isH160(address)) {
      throw new Error(
        'Contract address ' + address + ' is not valid h160 address'
      );
    }
  }

  async balanceOf(account: string): Promise<bigint> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      abi: Abi.Erc20,
      address: this.address as `0x${string}`,
      args: [account as `0x${string}`],
      functionName: 'balanceOf',
    });
    return output as bigint;
  }

  async decimals(): Promise<number> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      abi: Abi.Erc20,
      address: this.address as `0x${string}`,
      functionName: 'decimals',
    });
    return output as number;
  }

  async allowance(owner: string, spender: string): Promise<bigint> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      abi: Abi.Erc20,
      address: this.address as `0x${string}`,
      args: [owner as `0x${string}`, spender as `0x${string}`],
      functionName: 'allowance',
    });
    return output as bigint;
  }

  approve(spender: string, amount: bigint): string {
    return encodeFunctionData({
      abi: Abi.Erc20,
      args: [spender as `0x${string}`, amount],
      functionName: 'approve',
    });
  }
}
