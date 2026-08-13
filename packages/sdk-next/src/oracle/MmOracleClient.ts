import { AGGREGATOR_V3_ABI } from './abi';

import { EvmClient, EvmRpcAdapter } from '../evm';
import { MmOracleEntry } from './types';

export class MmOracleClient {
  private adapter: EvmRpcAdapter;
  private blockTime: () => Promise<number>;

  constructor(evm: EvmClient, blockTime: () => Promise<number>) {
    this.adapter = evm.getRPCAdapter();
    this.blockTime = blockTime;
  }

  async getData(address: string): Promise<MmOracleEntry> {
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

    const blockTimeMs = await this.blockTime();
    const msPerBlock = BigInt(Math.max(1, Math.round(blockTimeMs)));

    const elapsedMs = (block.timestamp - updatedAt) * 1000n;
    const updatedAtBlock = block.number - elapsedMs / msPerBlock;
    const updatedAtNum = Number(updatedAtBlock);

    return {
      price: answer,
      decimals: decimals,
      updatedAt: updatedAtNum < 0 ? 0 : updatedAtNum,
    };
  }
}
