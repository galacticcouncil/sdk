import { PoolFee, PoolLimits } from '../../types';
import { PoolQuery } from '../../PoolQuery';

/**
 * LBP pool reads.
 *
 * - A pool's account IS its address, so reserves are plain balances of it
 * - Weights ramp against the relay chain, so the tick needs the relay parent
 *   of the block it commits
 */
export class LbpQuery extends PoolQuery {
  /** Every pool's config (assets, weights, schedule, fee collector) */
  readonly poolData = this.cache.scope(
    'LBP.PoolData.entries',
    (at) => this.api.query.LBP.PoolData.getEntries({ at }),
    () => 'entries',
    'block'
  );

  /** Relay parent of a block */
  readonly validationData = this.cache.scope(
    'ParachainSystem.ValidationData',
    (at) => this.api.query.ParachainSystem.ValidationData.getValue({ at }),
    () => 'validationData',
    'block'
  );

  async repayFee(): Promise<PoolFee> {
    const repayFee = await this.api.constants.LBP.repay_fee();
    return repayFee as PoolFee;
  }

  async limits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.LBP.MaxInRatio(),
      this.api.constants.LBP.MaxOutRatio(),
      this.api.constants.LBP.MinTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
