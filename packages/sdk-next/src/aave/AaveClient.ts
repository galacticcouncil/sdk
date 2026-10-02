import { PublicClient } from 'viem';

import {
  AAVE_ATOKEN_ABI,
  AAVE_POOL_ABI,
  AAVE_POOL_DATA_PROVIDER_ABI,
} from './abi';
import { AAVE_POOL_DATA_PROVIDER } from './const';

import { EvmClient, H160 } from '../evm';
import { READ_TIMEOUT, withTimeout } from '../utils/async';

/**
 * Aave contract reads.
 *
 * - Market and user data go through the node's `eth_call`
 * - Reserve and aToken reads go through the runtime adapter, whose failures
 *   are typed: a plain aToken reverts rather than failing transport
 * - Every read is at the chain tip, whichever `at` the context pins
 * - Every read has a deadline
 */
export class AaveClient {
  private evm: EvmClient;
  private client: PublicClient;

  constructor(evm: EvmClient) {
    this.evm = evm;
    this.client = evm.getWsProvider();
  }

  async getBlockTimestamp() {
    const block = await this.read('getBlock', this.client.getBlock());
    return Number(block.timestamp);
  }

  /**
   * Every reserve of a market.
   *
   * @param provider - market's addresses provider
   */
  getReservesData(provider: string) {
    return this.read(
      `getReservesData ${provider}`,
      this.client.readContract({
        abi: AAVE_POOL_DATA_PROVIDER_ABI,
        address: AAVE_POOL_DATA_PROVIDER as H160,
        args: [provider as H160],
        functionName: 'getReservesData',
      })
    );
  }

  /**
   * A user's reserves in a market.
   *
   * @param user - user H160
   * @param provider - market's addresses provider
   */
  getUserReservesData(user: string, provider: string) {
    return this.read(
      `getUserReservesData ${provider}`,
      this.client.readContract({
        abi: AAVE_POOL_DATA_PROVIDER_ABI,
        address: AAVE_POOL_DATA_PROVIDER as H160,
        args: [provider as H160, user as H160],
        functionName: 'getUserReservesData',
      })
    );
  }

  /**
   * A user's aggregate position in a market.
   *
   * @param user - user H160
   * @param pool - market's pool
   */
  getUserAccountData(user: string, pool: string) {
    return this.read(
      `getUserAccountData ${pool}`,
      this.client.readContract({
        abi: AAVE_POOL_ABI,
        address: pool as H160,
        args: [user as H160],
        functionName: 'getUserAccountData',
      })
    );
  }

  /**
   * A user's collateral and borrowing bitmap in a market.
   *
   * - Bit `2i` flags borrowing reserve `i`, bit `2i + 1` flags using it as
   *   collateral
   *
   * @param user - user H160
   * @param pool - market's pool
   */
  async getUserConfiguration(user: string, pool: string): Promise<bigint> {
    const { data } = await this.read(
      `getUserConfiguration ${pool}`,
      this.client.readContract({
        abi: AAVE_POOL_ABI,
        address: pool as H160,
        args: [user as H160],
        functionName: 'getUserConfiguration',
      })
    );
    return data;
  }

  /**
   * A reserve's index in its pool.
   *
   * - User configuration bits are keyed by it
   *
   * @param pool - market's pool
   * @param underlying - reserve asset
   */
  async getReserveIndex(pool: string, underlying: string): Promise<number> {
    const { id } = await this.read(
      `getReserveData ${pool}`,
      this.evm.getRPCAdapter('best').readContract({
        abi: AAVE_POOL_ABI,
        address: pool as H160,
        args: [underlying as H160],
        functionName: 'getReserveData',
      })
    );
    return id;
  }

  /**
   * A user's unlocked balance of a lockable aToken.
   *
   * - Reverts on a plain aToken
   *
   * @param aToken - aToken contract
   * @param user - user H160
   */
  getFreeBalance(aToken: string, user: string): Promise<bigint> {
    return this.read(
      `getFreeBalance ${aToken}`,
      this.evm.getRPCAdapter('best').readContract({
        abi: AAVE_ATOKEN_ABI,
        address: aToken as H160,
        args: [user as H160],
        functionName: 'getFreeBalance',
      })
    );
  }

  private read<T>(label: string, p: Promise<T>): Promise<T> {
    return withTimeout(p, READ_TIMEOUT, `${label} read stalled`);
  }
}
