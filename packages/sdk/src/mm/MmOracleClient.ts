import { PublicClient } from 'viem';

import { AGGREGATOR_V3_ABI } from './abi';

import { EvmClient } from '../evm';
import { MmOracleEntry } from './types';

export class MmOracleClient {
  private client: PublicClient;

  constructor(evm: EvmClient) {
    this.client = evm.getWsProvider();
  }

  async getData(address: string, blockTimeInSec = 6): Promise<MmOracleEntry> {
    const [data, decimals, block] = await Promise.all([
      this.client.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'latestRoundData',
      }),
      this.client.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'decimals',
      }),
      this.client.getBlock(),
    ]);

    const [_roundId, answer, _startedAt, updatedAt] = data;
    const updatedAtBlock =
      block.number - (block.timestamp - updatedAt) / BigInt(blockTimeInSec);

    return {
      price: answer,
      decimals: decimals,
      updatedAt: Number(updatedAtBlock),
    };
  }
}
