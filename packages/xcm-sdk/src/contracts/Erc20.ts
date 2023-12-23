import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { parseAbi } from 'viem';

import { EvmClient } from '../evm';

const ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

export class Erc20 {
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

  async getBalance(): Promise<bigint> {
    const provider = this.#client.getProvider();
    const { address, args } = this.#config;
    const [recipient] = args;

    try {
      return await provider.readContract({
        address: address as `0x${string}`,
        abi: ABI,
        functionName: 'balanceOf',
        args: [recipient as `0x${string}`],
      });
    } catch {
      return 0n;
    }
  }

  async getDecimals(): Promise<number> {
    const provider = this.#client.getProvider();
    const { address } = this.#config;

    return await provider.readContract({
      address: address as `0x${string}`,
      abi: ABI,
      functionName: 'decimals',
    });
  }
}
