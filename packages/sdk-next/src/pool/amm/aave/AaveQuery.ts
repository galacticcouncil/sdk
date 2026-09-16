import { AAVE_POOL_ABI } from '../../../aave';

import { PoolQuery } from '../../PoolQuery';

import { TAavePool, TAavePools } from './types';

/**
 * Aave pool reads.
 *
 * - Liquidity comes from the trade executor runtime call, not storage: it
 *   applies the money market's live index, so both legs are coherent
 * - The reserve set can also be read from the money market itself, through
 *   block-pinned EVM reads with the adapter's full gas budget
 */
export class AaveQuery extends PoolQuery {
  /** Every reserve/atoken pair with its liquidity */
  readonly pools = this.cache.scope<[], TAavePools>(
    'AaveTradeExecutor.pools',
    (at) => this.api.apis.AaveTradeExecutor.pools({ at }),
    () => 'pools',
    'block'
  );

  /** One pair's liquidity in/out */
  readonly pool = this.cache.scope<[number, number], TAavePool>(
    'AaveTradeExecutor.pool',
    (at, reserve, atoken) =>
      this.api.apis.AaveTradeExecutor.pool(reserve, atoken, { at }),
    (reserve, atoken) => `${reserve}:${atoken}`,
    'block'
  );

  /** Every reserve the pool lists, lowercased */
  readonly reserves = this.cache.scope<[`0x${string}`], `0x${string}`[]>(
    'AavePool.getReservesList',
    async (at, pool) => {
      const list = await this.evm.getRPCAdapter(at).readContract({
        abi: AAVE_POOL_ABI,
        address: pool,
        functionName: 'getReservesList',
      });
      return list.map((a) => a.toLowerCase() as `0x${string}`);
    },
    (pool) => pool,
    'block'
  );

  /** One reserve's aToken address, lowercased */
  readonly reserveAToken = this.cache.scope<
    [`0x${string}`, `0x${string}`],
    `0x${string}`
  >(
    'AavePool.getReserveData',
    async (at, pool, reserve) => {
      const data = await this.evm.getRPCAdapter(at).readContract({
        abi: AAVE_POOL_ABI,
        address: pool,
        functionName: 'getReserveData',
        args: [reserve],
      });
      return data.aTokenAddress.toLowerCase() as `0x${string}`;
    },
    (pool, reserve) => `${pool}:${reserve}`,
    'block'
  );
}
