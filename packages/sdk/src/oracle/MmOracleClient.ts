import { AGGREGATOR_V3_ABI } from './abi';
import { MmOracleEntry } from './types';

import { EvmRpcAdapter, EvmClient } from '../evm';

export class MmOracleClient {
  private rpcAdapter: EvmRpcAdapter;

  constructor(evm: EvmClient) {
    this.rpcAdapter = evm.getRPCAdapter();
  }

  async getData(address: string, blockTimeInSec = 6): Promise<MmOracleEntry> {
    const [data, decimals, block] = await Promise.all([
      this.rpcAdapter.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'latestRoundData',
      }),
      this.rpcAdapter.readContract({
        abi: AGGREGATOR_V3_ABI,
        address: address as `0x${string}`,
        functionName: 'decimals',
      }),
      this.rpcAdapter.getBlock(),
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
