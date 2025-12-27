import { GHO_TOKEN_ABI } from './abi';

import { EvmClient, EvmRpcAdapter } from '../evm';

export class GhoTokenClient {
  private rpcAdapter: EvmRpcAdapter;

  constructor(evm: EvmClient) {
    this.rpcAdapter = evm.getRPCAdapter();
  }

  async getFacilitatorCapacity(
    address: string,
    facilitator: string
  ): Promise<bigint> {
    const [capacity, level] = await this.rpcAdapter.readContract({
      abi: GHO_TOKEN_ABI,
      address: address as `0x${string}`,
      functionName: 'getFacilitatorBucket',
      args: [facilitator as `0x${string}`],
    });

    return capacity - level;
  }
}
