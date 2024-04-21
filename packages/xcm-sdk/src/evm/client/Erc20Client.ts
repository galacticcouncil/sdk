import { Abi } from '@galacticcouncil/xcm-core';
import { encodeFunctionData } from 'viem';

import { EvmClient } from '../EvmClient';

export class Erc20Client {
  protected readonly client: EvmClient;
  protected readonly address: string;

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
  }

  get abi() {
    return Abi.Erc20;
  }

  async balanceOf(account: string): Promise<bigint> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      address: this.address as `0x${string}`,
      abi: this.abi,
      functionName: 'balanceOf',
      args: [account as `0x${string}`],
    });
    return output as bigint;
  }

  async decimals(): Promise<number> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      address: this.address as `0x${string}`,
      abi: this.abi,
      functionName: 'decimals',
    });
    return output as number;
  }

  async allowance(owner: string, spender: string): Promise<bigint> {
    const provider = this.client.getProvider();
    const output = await provider.readContract({
      address: this.address as `0x${string}`,
      abi: this.abi,
      functionName: 'allowance',
      args: [owner as `0x${string}`, spender as `0x${string}`],
    });
    return output as bigint;
  }

  approve(spender: string, amount: bigint): string {
    return encodeFunctionData({
      abi: this.abi,
      functionName: 'approve',
      args: [spender as `0x${string}`, amount],
    });
  }
}
