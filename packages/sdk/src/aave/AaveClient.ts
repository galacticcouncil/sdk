import { AAVE_POOL_ABI, AAVE_POOL_DATA_PROVIDER_ABI } from './abi';
import {
  AAVE_LENDING_POOL_ADDRESS,
  AAVE_POOL_DATA_PROVIDER,
  AAVE_POOL_PROXY,
} from './const';

import { EvmClient } from '../evm';

export class AaveClient {
  private evmClient: EvmClient;

  constructor() {
    this.evmClient = new EvmClient();
  }

  async getReservesData() {
    const evmProvider = this.evmClient.getProvider();
    const output = await evmProvider.readContract({
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      address: AAVE_POOL_DATA_PROVIDER as `0x${string}`,
      args: [AAVE_LENDING_POOL_ADDRESS as `0x${string}`],
      functionName: 'getReservesData',
    });
    return output;
  }

  async getUserReservesData(user: string) {
    const evmProvider = this.evmClient.getProvider();
    const output = await evmProvider.readContract({
      abi: AAVE_POOL_DATA_PROVIDER_ABI,
      address: AAVE_POOL_DATA_PROVIDER as `0x${string}`,
      args: [AAVE_LENDING_POOL_ADDRESS as `0x${string}`, user as `0x${string}`],
      functionName: 'getUserReservesData',
    });
    return output;
  }

  async getUserAccountData(user: string) {
    const evmProvider = this.evmClient.getProvider();
    const output = await evmProvider.readContract({
      abi: AAVE_POOL_ABI,
      address: AAVE_POOL_PROXY as `0x${string}`,
      args: [user as `0x${string}`],
      functionName: 'getUserAccountData',
    });
    return output;
  }
}
