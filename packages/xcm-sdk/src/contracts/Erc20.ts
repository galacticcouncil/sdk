import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { parseAbi } from 'viem';

import { EvmClient } from '../evm';

const ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

type RecipientResolver = (address: string) => Promise<string>;

export class Erc20 {
  readonly #client: EvmClient;
  readonly #config: ContractConfig;
  readonly #resolver?: RecipientResolver;

  constructor(
    client: EvmClient,
    config: ContractConfig,
    resolver?: RecipientResolver
  ) {
    this.validateClient(client);
    this.validateConfig(config);
    this.#client = client;
    this.#config = config;
    this.#resolver = resolver;
  }

  private validateClient(client: EvmClient) {
    if (!client) {
      throw new Error(`No EVM client found`);
    }
  }

  private async validateConfig(config: ContractConfig) {
    if (!config.address) {
      throw new Error('Erc20 address is required');
    }
  }

  private async resolve(address: string): Promise<string> {
    return this.#resolver ? await this.#resolver(address) : address;
  }

  async getBalance(): Promise<bigint> {
    const provider = this.#client.getProvider();
    const { address, args } = this.#config;
    const [recipient] = args;

    const resolved = await this.resolve(recipient);
    return await provider.readContract({
      address: address as `0x${string}`,
      abi: ABI,
      functionName: 'balanceOf',
      args: [resolved as `0x${string}`],
    });
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
