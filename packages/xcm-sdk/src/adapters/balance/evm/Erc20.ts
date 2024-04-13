import { Abi } from '@galacticcouncil/xcm-core';
import { EvmBalance } from './EvmBalance';

export class Erc20 extends EvmBalance {
  get abi() {
    return Abi.IERC20;
  }

  async allowance(): Promise<bigint> {
    const provider = this.client.getProvider();
    const { address, args } = this.config;
    const [recipient] = args;

    const output = await provider.readContract({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: 'allowance',
      args: [address as `0x${string}`, recipient as `0x${string}`],
    });
    return output as bigint;
  }

  async approve(amount: bigint): Promise<bigint> {
    const provider = this.client.getProvider();
    const { address, args } = this.config;
    const [recipient] = args;

    const output = await provider.readContract({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: 'approve',
      args: [recipient as `0x${string}`, amount],
    });
    return output as bigint;
  }

  async getBalance(): Promise<bigint> {
    const provider = this.client.getProvider();
    const { address, args } = this.config;
    const [recipient] = args;

    const output = await provider.readContract({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: 'balanceOf',
      args: [recipient as `0x${string}`],
    });
    return output as bigint;
  }

  async getDecimals(): Promise<number> {
    const provider = this.client.getProvider();
    const { address } = this.config;

    const output = await provider.readContract({
      address: address as `0x${string}`,
      abi: this.abi,
      functionName: 'decimals',
    });
    return output as number;
  }
}
