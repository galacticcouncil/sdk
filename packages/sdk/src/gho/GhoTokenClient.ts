import { PublicClient } from 'viem';

import { GHO_TOKEN_ABI } from './abi';

import { EvmClient } from '../evm';

export class GhoTokenClient {
  private client: PublicClient;

  constructor(evm: EvmClient) {
    this.client = evm.getWsProvider();
  }

  async getFacilitatorCapacity(
    address: string,
    facilitator: string
  ): Promise<bigint> {
    const [capacity, level] = await this.client.readContract({
      abi: GHO_TOKEN_ABI,
      address: address as `0x${string}`,
      functionName: 'getFacilitatorBucket',
      args: [facilitator as `0x${string}`],
    });
    return capacity - level;
  }
}
