import { AAVE_POOL_ABI, AAVE_POOL_DATA_PROVIDER_ABI } from './abi';
import {
  AAVE_LENDING_POOL_ADDRESS,
  AAVE_POOL_DATA_PROVIDER,
  AAVE_POOL_PROXY,
} from './const';

import { EvmClient, EvmRpcAdapter } from '../evm';

export class AaveClient {
  private rpcAdapter: EvmRpcAdapter;

  constructor(evm: EvmClient) {
    this.rpcAdapter = evm.getRPCAdapter();
  }

  async getBlockTimestamp() {
    const block = await this.rpcAdapter.getBlock();
    return Number(block.timestamp);
  }

  async getReservesData() {
    const output = await this.rpcAdapter.readContract({
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      address: AAVE_POOL_DATA_PROVIDER as `0x${string}`,
      functionName: 'getReservesData',
      args: [AAVE_LENDING_POOL_ADDRESS as `0x${string}`],
    });
    return output;
  }

  async getUserReservesData(user: string) {
    const output = await this.rpcAdapter.readContract({
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      address: AAVE_POOL_DATA_PROVIDER as `0x${string}`,
      functionName: 'getUserReservesData',
      args: [AAVE_LENDING_POOL_ADDRESS as `0x${string}`, user as `0x${string}`],
    });
    return output;
  }

  async getUserAccountData(user: string) {
    const output = await this.rpcAdapter.readContract({
      abi: AAVE_POOL_ABI,
      address: AAVE_POOL_PROXY as `0x${string}`,
      functionName: 'getUserAccountData',
      args: [user as `0x${string}`],
    });
    return output;
  }
}
