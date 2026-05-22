import { AGGREGATOR_V3_ABI } from './abi';

import { EvmClient, EvmRpcAdapter } from '../evm';
import { MmOracleEntry } from './types';

export class MmOracleClient {
  private adapter: EvmRpcAdapter;

  constructor(evm: EvmClient) {
    this.adapter = evm.getRPCAdapter();
  }

  async getData(address: string, blockTimeInSec = 6): Promise<MmOracleEntry> {
    const [data, decimals, block] = await Promise.all([
      this.adapter.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'latestRoundData',
      }),
      this.adapter.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'decimals',
      }),
      this.adapter.getBlock(),
    ]);

    const [_roundId, answer, _startedAt, updatedAt] = data;
    const updatedAtBlock =
      block.number - (block.timestamp - updatedAt) / BigInt(blockTimeInSec);
    const updatedAtNum = Number(updatedAtBlock);

    return {
      price: answer,
      decimals: decimals,
      updatedAt: updatedAtNum < 0 ? 0 : updatedAtNum,
    };
  }
}
