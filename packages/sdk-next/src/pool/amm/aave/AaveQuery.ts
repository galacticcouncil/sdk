import { PoolQuery } from '../../PoolQuery';

import { TAavePool, TAavePools } from './types';

/**
 * Aave pool reads.
 *
 * - Reserves come from the trade executor runtime call, not storage: it applies
 *   the money market's live index, so both legs are coherent
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
}
