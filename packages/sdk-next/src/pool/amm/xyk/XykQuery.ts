import { PoolFee, PoolLimits } from '../../types';
import { PoolQuery } from '../../PoolQuery';

/**
 * XYK pool reads.
 *
 * - A pool's account IS its address, so reserves are plain balances of it
 * - The exchange fee is a runtime constant, equal for every pool
 */
export class XykQuery extends PoolQuery {
  /** Every pool's asset pair, keyed by pool address */
  readonly poolAssets = this.cache.scope(
    'XYK.PoolAssets.entries',
    (at) => this.api.query.XYK.PoolAssets.getEntries({ at }),
    () => 'entries',
    'block'
  );

  async exchangeFee(): Promise<PoolFee> {
    const fee = await this.api.constants.XYK.GetExchangeFee();
    return fee as PoolFee;
  }

  async limits(): Promise<PoolLimits> {
    const [maxInRatio, maxOutRatio, minTradingLimit] = await Promise.all([
      this.api.constants.XYK.MaxInRatio(),
      this.api.constants.XYK.MaxOutRatio(),
      this.api.constants.XYK.MinTradingLimit(),
    ]);

    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
